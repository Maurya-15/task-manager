const { validationResult } = require('express-validator');

/**
 * Express middleware that checks express-validator results and responds with
 * structured JSON on failure. Invalid MongoDB ObjectId on `id` param returns 400.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
    return;
  }

  const formatted = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  const onlyInvalidMongoId = formatted.length === 1 && formatted[0].field === 'id';

  if (onlyInvalidMongoId) {
    res.status(400).json({
      success: false,
      message: 'Invalid task ID format',
    });
    return;
  }

  res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: formatted,
  });
};

module.exports = validate;
