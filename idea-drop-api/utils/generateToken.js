import { SignJWT } from 'jose';
import { JWT_SECRET } from './getJwtSSecret.js';

/**
 * Generate a JWT token
 * @param {Object} payload - The payload to sign
 * @param {number} expiresIn - The expiration time in seconds(eg: '15m', '1h', '1d')
 * @returns {Promise<string>} - The signed JWT token
 */

export const generateToken = async (payload, expiresIn = '15m') => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
};
