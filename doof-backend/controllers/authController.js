// Filename: /root/doof-backend/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import config from '../config/config.js';
import { validationResult } from 'express-validator';
import { formatUser } from '../utils/formatters.js';

const generateAccessToken = (user) => {
  if (!config || !config.JWT_SECRET) {
    throw new Error("Server configuration error: JWT secret missing.");
  }
  const expiresIn = config.JWT_EXPIRATION || '1h';
  return jwt.sign({ user }, config.JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (user) => {
  if (!config || !config.REFRESH_TOKEN_SECRET) {
    throw new Error("Server configuration error: Refresh token secret missing.");
  }
  const expiresIn = config.REFRESH_TOKEN_EXPIRATION || '7d';
  return jwt.sign({ id: user.id }, config.REFRESH_TOKEN_SECRET, { expiresIn });
};

const verifyRefreshToken = (token) => {
  if (!config || !config.REFRESH_TOKEN_SECRET) {
    throw new Error("Server configuration error: Refresh token secret missing.");
  }
  return jwt.verify(token, config.REFRESH_TOKEN_SECRET);
};

export const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array({ onlyFirstError: true }).map(e => ({ msg: e.msg, param: e.path })) });
  }
  const { username, email, password } = req.body;
  try {
    const newUser = await UserModel.createUser(username, email, password);
    if (!newUser) {
      return res.status(500).json({ success: false, message: 'Failed to create user.' });
    }
    const formattedUser = formatUser(newUser);
    const accessToken = generateAccessToken(formattedUser);
    const refreshToken = generateRefreshToken(formattedUser);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ success: true, message: 'User registered successfully.', data: { user: formattedUser, token: accessToken } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array({ onlyFirstError: true }).map(e => ({ msg: e.msg, param: e.path })) });
  }
  const { email, password } = req.body;
  try {
    const user = await UserModel.findUserByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    console.log('Input password:', password);
    console.log('Stored hash:', user.password_hash);
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('Password match result:', isMatch);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }
    const formattedUser = formatUser(user);
    const accessToken = generateAccessToken(formattedUser);
    const refreshToken = generateRefreshToken(formattedUser);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, message: 'Login successful.', data: { user: formattedUser, token: accessToken } });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

export const getStatus = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required but user not found.' });
  }
  try {
    const formattedUser = formatUser(req.user);
    res.json({ success: true, message: 'User is authenticated.', data: { user: formattedUser } });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not provided.' });
  }
  try {
    const decoded = verifyRefreshToken(incomingRefreshToken);
    const user = await UserModel.findUserById(decoded.id);
    if (!user) {
      return res.status(403).json({ success: false, message: 'Invalid refresh token (user not found).' });
    }
    const formattedUser = formatUser(user);
    const newAccessToken = generateAccessToken(formattedUser);
    res.json({ success: true, token: newAccessToken, user: formattedUser });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(403).json({ success: false, message: `Invalid or expired refresh token (${error.name}).` });
    }
    next(error);
  }
};

export const logout = async (req, res, next) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  res.status(200).json({ success: true, message: 'Logout successful.' });
};

export const updateAccountType = async (req, res, next) => {
  const { userId } = req.params;
  const { account_type } = req.body;
  const numericUserId = parseInt(userId, 10);
  try {
    const updatedUser = await UserModel.updateAccountType(numericUserId, account_type);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: 'Account type updated successfully.', data: formatUser(updatedUser) });
  } catch (error) {
    next(error);
  }
};

const authController = {
  register,
  login,
  getStatus,
  refreshToken,
  logout,
  updateAccountType
};
export default authController;