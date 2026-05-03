const { body } = require('express-validator');

/**
 * Validation chain for user registration.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 80 })
    .withMessage('Name is too long'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

/**
 * Validation chain for login.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const loginValidator = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidator, loginValidator };
