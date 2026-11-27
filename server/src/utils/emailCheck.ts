/**
 * Sign-up email checks. A format check alone accepts anything with an "@"; these checks also make sure
 * the domain can actually receive email and isn't a throwaway inbox. They can't prove the mailbox exists
 * (that needs a confirmation email), but they stop most made-up addresses.
 */
// DNS over HTTPS: plain web requests, so it works on networks that block or stall normal DNS lookups.
const DOH_SERVERS = ['https://cloudflare-dns.com/dns-query', 'https://dns.google/resolve'];

type DohAnswer = { Status: number; Answer?: Array<{ type: number; data: string }> };

/** One DNS question over HTTPS. Returns null if no server could be reached. */
async function dohQuery(name: string, type: 'MX' | 'A'): Promise<DohAnswer | null> {
  for (const server of DOH_SERVERS) {
    try {
      const res = await fetch(`${server}?name=${encodeURIComponent(name)}&type=${type}`, {
        headers: { accept: 'application/dns-json' },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) return (await res.json()) as DohAnswer;
    } catch {
      // try the next server
    }
  }
  return null;
}

// Letters, digits and . _ % + - before the @; a dotted domain ending in a 2+ letter top-level domain.
const EMAIL_PATTERN = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

// Common throwaway / temporary inbox services.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', 'grr.la', '10minutemail.com',
  '10minutemail.net', 'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmailo.com', 'tempail.com', 'yopmail.com',
  'yopmail.net', 'trashmail.com', 'getnada.com', 'nada.email', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com',
  'fakeinbox.com', 'mintemail.com', 'mohmal.com', 'emailondeck.com', 'burnermail.io', 'mailnesia.com', 'moakt.com',
  'tempinbox.com', 'spamgourmet.com', 'mailcatch.com', 'mytemp.email', 'tmpmail.org', 'tmail.ws', 'emailfake.com',
  'fakemail.net', 'inboxkitten.com', 'mail.tm', 'mailpoof.com', 'discard.email', 'spambox.us'
]);

// Frequent misspellings of popular providers.
const TYPO_FIXES: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.con': 'gmail.com',
  'gmal.com': 'gmail.com', 'gmail.in': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com',
  'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com', 'rediffmai.com': 'rediffmail.com', 'iclod.com': 'icloud.com'
};

export type EmailCheck = { ok: true } | { ok: false; error: string };

/** Checks that need no network: format, throwaway domains, typos. */
export function checkEmailFormat(email: string): EmailCheck {
  const value = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(value) || value.includes('..')) {
    return { ok: false, error: 'Please enter a valid email address, for example name@gmail.com.' };
  }
  const [local, domain] = value.split('@');
  const fix = TYPO_FIXES[domain];
  if (fix) return { ok: false, error: `Did you mean ${local}@${fix}? Please check the spelling of your email.` };
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, error: 'Temporary or throwaway email addresses are not allowed. Please use your real email.' };
  }
  return { ok: true };
}

/** Does the domain accept email? true / false, or null when DNS couldn't be checked (then we don't block). */
export async function domainAcceptsMail(domain: string): Promise<boolean | null> {
  const mx = await dohQuery(domain, 'MX');
  if (!mx) return null;
  if (mx.Status === 3) return false; // NXDOMAIN: the domain doesn't exist
  if (mx.Status !== 0) return null; // server failure etc.
  const records = (mx.Answer || []).filter(r => r.type === 15).map(r => r.data.trim());
  // A single "null MX" ("0 .") means the domain explicitly refuses email.
  if (records.length === 1 && /^0\s+\.?$/.test(records[0])) return false;
  if (records.length > 0) return true;
  // No MX records: mail can still go to the domain's address record.
  const a = await dohQuery(domain, 'A');
  if (!a) return null;
  return a.Status === 0 && (a.Answer || []).some(r => r.type === 1);
}

/** Full sign-up check: format first, then a DNS lookup of the domain. */
export async function checkSignupEmail(email: string): Promise<EmailCheck> {
  const format = checkEmailFormat(email);
  if (!format.ok) return format;
  const domain = email.trim().toLowerCase().split('@')[1];
  if ((await domainAcceptsMail(domain)) === false) {
    return { ok: false, error: `"${domain}" can't receive email. Please check your email address.` };
  }
  return { ok: true };
}
