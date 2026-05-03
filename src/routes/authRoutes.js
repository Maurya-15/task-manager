const express = require('express');
const validate = require('../middlewares/validate');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const { register, login } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);

module.exports = router;
