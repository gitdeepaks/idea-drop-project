import { jwtVerify } from 'jose';
import { JWT_SECRET } from '../utils/getJwtSSecret.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (!payload || !payload.userId) {
        return res
          .status(401)
          .json({ message: 'Not authorized, invalid token payload' });
      }

      const user = await User.findById(payload.userId).select('_id name email');

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      console.log('JWT verification error:', jwtError.message);
      return res
        .status(401)
        .json({ message: 'Not authorized, token expired or invalid' });
    }
  } catch (error) {
    console.log('Auth middleware error:', error);
    return res
      .status(401)
      .json({ message: 'Not authorized, authentication failed' });
  }
};
