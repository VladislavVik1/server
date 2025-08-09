import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const getSecret = () => process.env.JWT_SECRET || 'dev_secret';

export const authenticate = (opts = {}) => (req, res, next) => {
  try {
    if (req.method === 'OPTIONS') return next();

    const header = (req.headers.authorization || '').trim();
    const m = /^Bearer\s+(.+)$/i.exec(header);
    let token = m ? m[1].trim() : null;

    if (!token && opts.allowCookie && req.cookies?.token) {
      token = req.cookies.token;
    }
    if (!token) return res.status(401).json({ message: 'Token missed' });

    const payload = jwt.verify(token, getSecret());

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp,
    };

    if (opts.roles?.length && !opts.roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Missing rules' });
    }

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Wrong token' });
  }
};

export const requireRoles = (...roles) => authenticate({ roles });
