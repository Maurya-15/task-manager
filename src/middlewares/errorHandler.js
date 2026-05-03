/**
 * Global Express error-handling middleware (four arguments).
 * Maps known Mongoose and database errors to appropriate HTTP responses.
 *
 * @param {Error} err - Thrown error.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid task ID format',
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  if (err.name === 'ValidationError' && err.errors) {
    const fieldErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: fieldErrors,
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  if (err.code === 11000) {
    const key = err.keyPattern ? Object.keys(err.keyPattern)[0] : '';
    let message = 'A record with this value already exists';
    if (key === 'email') {
      message = 'An account with this email already exists';
    }
    res.status(409).json({
      success: false,
      message,
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
