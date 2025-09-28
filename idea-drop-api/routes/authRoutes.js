import express from 'express';
import User from '../models/User.js';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from '../utils/getJwtSSecret.js';
import { generateToken } from '../utils/generateToken.js';

const router = express.Router();

//@route         POST api/auth/register
//@description   Register a new user
//@access        Public
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });
    await user.save();

    const payload = { userId: user._id.toString() };
    const accessToken = await generateToken(payload, '15m');
    const refreshToken = await generateToken(payload, '30d');

    //set refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//@route         POST api/auth/login
//@description   Login a user and clear refresh token
//@access        Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password?.trim()) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }
    //check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    //check if password is correct
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = { userId: user._id.toString() };
    const accessToken = await generateToken(payload, '15m');
    const refreshToken = await generateToken(payload, '30d');

    //set refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//@route         POST api/auth/login
//@description   Login a user and clear refresh token
//@access        Public
router.post('/logout', async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//@route         POST api/auth/refresh
//@description   Generate a new access token from refresh token
//@access        Public (Need valid refresh token in cookie)
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    console.log('refresh token.....');

    if (!token) {
      return res.status(401).json({ message: 'No refresh token found' });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (!payload || !payload.userId) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const user = await User.findById(payload.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const newAccessToken = await generateToken(
        { userId: user._id.toString() },
        '15m'
      );

      res.json({
        accessToken: newAccessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (jwtError) {
      console.log('Refresh token verification error:', jwtError.message);
      return res
        .status(401)
        .json({ message: 'Invalid or expired refresh token' });
    }
  } catch (error) {
    console.log('Refresh token error:', error);
    return res.status(401).json({ message: 'Failed to refresh token' });
  }
});

export default router;
