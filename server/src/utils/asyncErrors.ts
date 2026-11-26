// Express 4 does not forward rejected promises from async route handlers to the
// error middleware, so a thrown error (e.g. a ZodError) becomes an unhandled
// rejection that crashes the process. This patches Express's route layer so that
// async handler rejections are passed to next(err), like Express 5 does natively.
// Import this module once, before any routes are registered.
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Layer = require('express/lib/router/layer');

Layer.prototype.handle_request = function handleRequest(this: { handle: Function }, req: unknown, res: unknown, next: (err?: unknown) => void) {
  const fn = this.handle;

  if (fn.length > 3) {
    // Error-handling middleware (err, req, res, next) is not a request handler.
    return next();
  }

  try {
    const result = fn(req, res, next);
    if (result && typeof result.catch === 'function') {
      result.catch(next);
    }
  } catch (err) {
    next(err);
  }
};
