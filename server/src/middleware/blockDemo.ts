import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export function isDemoEmail(email?: string | null): boolean {
  return Boolean(config.demoEmail) && email?.toLowerCase() === config.demoEmail;
}

/** Stops visitors from locking or deleting the shared demo account. */
export function blockDemo(req: Request, res: Response, next: NextFunction): void {
  if (isDemoEmail(req.user?.email)) {
    res.status(403).json({ error: 'This is the shared demo account, so this action is turned off. Create your own account to try it.' });
    return;
  }
  next();
}
