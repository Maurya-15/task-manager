const express = require('express');
const validate = require('../middlewares/validate');
const {
  createTaskValidator,
  updateTaskValidator,
  objectIdValidator,
} = require('../validators/taskValidator');
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  markComplete,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

router.post('/', createTaskValidator, validate, createTask);

router.get('/', getAllTasks);

router.get('/:id', objectIdValidator, validate, getTaskById);

router.put('/:id', objectIdValidator, validate, updateTaskValidator, validate, updateTask);

router.patch('/:id/complete', objectIdValidator, validate, markComplete);

router.patch('/:id/done', objectIdValidator, validate, markComplete);

router.delete('/:id', objectIdValidator, validate, deleteTask);

module.exports = router;
