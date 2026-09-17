const env = require('../config/env');

function errorHandler(err, req, res, next) {
  if (env.NODE_ENV !== 'test') {
    console.error('[Error Handler]', err);
  }

  const status = err.status || err.statusCode || 500;
  const response = {
    message: err.message || 'Internal server error'
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  // Never leak internal stack traces in production
  if (env.NODE_ENV !== 'production' && err.stack) {
    response.debug = err.stack;
  }

  res.status(status).json(response);
}

module.exports = errorHandler;
