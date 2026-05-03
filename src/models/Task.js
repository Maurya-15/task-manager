const mongoose = require('mongoose');

const CATEGORY_VALUES = ['work', 'personal', 'shopping', 'health', 'other'];

/**
 * Returns the start of the current calendar day for due-date comparisons.
 *
 * @returns {Date}
 */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: {
        values: CATEGORY_VALUES,
        message: 'Category must be one of: work, personal, shopping, health, other',
      },
      default: 'other',
    },
    dueDate: {
      type: Date,
      validate: {
        /**
         * Ensures dueDate is not before the start of today when provided.
         *
         * @param {Date|undefined} value - Optional due date.
         * @returns {boolean}
         */
        validator(value) {
          if (!value) return true;
          return value >= startOfToday();
        },
        message: 'Due date cannot be in the past',
      },
    },
  },
  {
    timestamps: true,
  },
);

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
module.exports.CATEGORY_VALUES = CATEGORY_VALUES;
