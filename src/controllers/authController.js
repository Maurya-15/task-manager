const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @param {function(...args: any): Promise<void>} fn
 * @returns {import('express').RequestHandler}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @param {import('mongoose').Types.ObjectId} userId
 * @returns {string}
 */
const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ userId: userId.toString() }, secret, { expiresIn: '7d' });
};

/**
 * Registers a new user and returns a JWT.
 *
 * @type {import('express').RequestHandler}
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
  });
  const token = signToken(user.id);
  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      token,
      user: { name: user.name, email: user.email },
    },
  });
});

/**
 * Authenticates a user and returns a JWT.
 *
 * @type {import('express').RequestHandler}
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }
  const token = signToken(user.id);
  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      token,
      user: { name: user.name, email: user.email },
    },
  });
});

module.exports = { register, login };
