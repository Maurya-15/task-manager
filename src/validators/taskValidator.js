const { body, param } = require('express-validator');
const { CATEGORY_VALUES } = require('../models/Task');

/**
 * Returns the start of today for due date comparisons.
 *
 * @returns {Date}
 */
const getStartOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Validator chain for creating a task.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title must not be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(CATEGORY_VALUES)
    .withMessage(`Category must be one of: ${CATEGORY_VALUES.join(', ')}`),
  body('dueDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date')
    .toDate()
    .custom((value) => {
      if (value < getStartOfToday()) {
        throw new Error('Due date must not be in the past');
      }
      return true;
    }),
];

/**
 * Validator chain for updating a task. Rejects requests that include isCompleted.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const updateTaskValidator = [
  body('isCompleted')
    .not()
    .exists()
    .withMessage('isCompleted cannot be updated via this endpoint. Use PATCH /complete.')
    .bail(),
  body('title')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Title must not be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(CATEGORY_VALUES)
    .withMessage(`Category must be one of: ${CATEGORY_VALUES.join(', ')}`),
  body('dueDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date')
    .toDate()
    .custom((value) => {
      if (value < getStartOfToday()) {
        throw new Error('Due date must not be in the past');
      }
      return true;
    }),
];

/**
 * Validates the :id route parameter as a MongoDB ObjectId.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const objectIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID format'),
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  objectIdValidator,
};
