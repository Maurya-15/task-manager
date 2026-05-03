const Task = require('../models/Task');

/**
 * Wraps an async route handler so rejected promises are forwarded to Express
 * error middleware.
 *
 * @param {function(
 *   import('express').Request,
 *   import('express').Response,
 *   import('express').NextFunction
 * ): Promise<void>} fn - Async handler.
 * @returns {import('express').RequestHandler}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Parses a query string boolean (e.g. "true", "false") into boolean or undefined.
 *
 * @param {string|undefined} value - Raw query value.
 * @returns {boolean|undefined}
 */
const parseBooleanQuery = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
};

/**
 * Merges user scope into a filter when the request is authenticated.
 *
 * @param {Record<string, unknown>} filter
 * @param {string|undefined} userId
 * @returns {Record<string, unknown>}
 */
const withUserScope = (filter, userId) => {
  if (!userId) return filter;
  return { ...filter, user: userId };
};

/**
 * Builds id (+ optional user) query for single-task operations.
 *
 * @param {string} id
 * @param {string|undefined} userId
 * @returns {{ _id: string, user?: string }}
 */
const idQuery = (id, userId) => (userId ? { _id: id, user: userId } : { _id: id });

/**
 * Parses pagination query params with safe defaults and bounds.
 *
 * @param {string|undefined} pageRaw - page query value.
 * @param {string|undefined} limitRaw - limit query value.
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPagination = (pageRaw, limitRaw) => {
  const page = Math.max(1, parseInt(pageRaw, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Creates a new task from validated request body.
 *
 * @type {import('express').RequestHandler}
 */
const createTask = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.userId) {
    payload.user = req.userId;
  }
  const task = await Task.create(payload);
  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: task,
  });
});

/**
 * Returns paginated tasks with optional filters for category and completion status.
 *
 * @type {import('express').RequestHandler}
 */
const getAllTasks = asyncHandler(async (req, res) => {
  const {
    category,
    isCompleted,
    page: pageRaw,
    limit: limitRaw,
  } = req.query;
  const filter = {};

  if (category) {
    filter.category = String(category);
  }

  const completedFilter = parseBooleanQuery(isCompleted);
  if (completedFilter !== undefined) {
    filter.isCompleted = completedFilter;
  }

  const scoped = withUserScope(filter, req.userId);

  const { page, limit, skip } = getPagination(pageRaw, limitRaw);

  const [total, tasks] = await Promise.all([
    Task.countDocuments(scoped),
    Task.find(scoped)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
  ]);

  res.status(200).json({
    success: true,
    message: 'Tasks retrieved successfully',
    data: {
      total,
      page,
      limit,
      tasks,
    },
  });
});

/**
 * Returns a single task by MongoDB ObjectId.
 *
 * @type {import('express').RequestHandler}
 */
const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await Task.findOne(idQuery(id, req.userId));
  if (!task) {
    res.status(404).json({
      success: false,
      message: 'Task not found',
    });
    return;
  }
  res.status(200).json({
    success: true,
    message: 'Task retrieved successfully',
    data: task,
  });
});

/**
 * Updates an existing task. Does not allow changing isCompleted (use markComplete).
 *
 * @type {import('express').RequestHandler}
 */
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  delete updates.isCompleted;

  const task = await Task.findOneAndUpdate(idQuery(id, req.userId), updates, {
    new: true,
    runValidators: true,
  });

  if (!task) {
    res.status(404).json({
      success: false,
      message: 'Task not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: task,
  });
});

/**
 * Marks a task as completed. Returns 400 if already completed.
 *
 * @type {import('express').RequestHandler}
 */
const markComplete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await Task.findOne(idQuery(id, req.userId));

  if (!task) {
    res.status(404).json({
      success: false,
      message: 'Task not found',
    });
    return;
  }

  if (task.isCompleted) {
    res.status(400).json({
      success: false,
      message: 'Task is already marked as completed. No changes were made.',
    });
    return;
  }

  task.isCompleted = true;
  await task.save();

  res.status(200).json({
    success: true,
    message: 'Task marked as completed',
    data: task,
  });
});

/**
 * Deletes a task by id.
 *
 * @type {import('express').RequestHandler}
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await Task.findOneAndDelete(idQuery(id, req.userId));

  if (!task) {
    res.status(404).json({
      success: false,
      message: 'Task not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
    data: null,
  });
});

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  markComplete,
  deleteTask,
};
