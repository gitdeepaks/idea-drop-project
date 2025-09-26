import { jwtVerify } from 'jose';
import { JWT_SECRET } from '../utils/getJwtSSecret.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }

    const token = authHeader.split(' ')[1];
    const { payload } = jwtVerify(token, JWT_SECRET);
    const user = await User.findById(payload.userId).select('_id name email');

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401);
    next(new Error('Not authorized, token failed'));
  }
};
