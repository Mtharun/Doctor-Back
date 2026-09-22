// Wraps an async Express route/controller so any thrown error or rejected
// promise is forwarded to next(err) automatically, instead of every
// controller needing its own try/catch.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
