// Lets async route handlers throw errors without needing try/catch in every route
module.exports = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
