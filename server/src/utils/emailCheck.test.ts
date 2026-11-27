import { describe, it, expect } from 'vitest';
import { checkEmailFormat } from './emailCheck.js';

describe('checkEmailFormat', () => {
  it('accepts normal addresses', () => {
    for (const e of ['ravi.kumar@gmail.com', 'a_b+fit@outlook.com', 'x@mail.example.co.in', 'Name@Yahoo.com']) {
      expect(checkEmailFormat(e).ok).toBe(true);
    }
  });

  it('rejects malformed addresses', () => {
    for (const e of ['abc', 'a@b', 'a@b.c', '@gmail.com', 'a@.com', 'a@gmail..com', 'a..b@gmail.com', '.a@gmail.com', 'a b@gmail.com', 'a@gmail.c0m']) {
      expect(checkEmailFormat(e).ok, e).toBe(false);
    }
  });

  it('rejects throwaway inboxes', () => {
    expect(checkEmailFormat('test@mailinator.com').ok).toBe(false);
    expect(checkEmailFormat('test@yopmail.com').ok).toBe(false);
  });

  it('suggests the fix for common typos', () => {
    const r = checkEmailFormat('ravi@gmial.com');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('ravi@gmail.com');
  });
});
