// middleware/auth.js
import jwt from 'jsonwebtoken';

const { JWT_SECRET = 'dev_secret' } = process.env;

/**
 * authenticate({ roles: ['admin', 'responder'], allowCookie: true })
 * Кладёт в req.user: { id, email, role, iat, exp }
 */
export const authenticate = (opts = {}) => (req, res, next) => {
  try {
    // Пропускаем preflight
    if (req.method === 'OPTIONS') return next();

    const header = (req.headers.authorization || '').trim();
    const m = /^Bearer\s+(.+)$/i.exec(header);
    let token = m ? m[1].trim() : null;

    // опционально читаем из cookie
    if (!token && opts.allowCookie && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ message: 'Нет токена' });

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp,
    };

    if (opts.roles?.length && !opts.roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Нет прав' });
    }

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Неверный/протухший токен' });
  }
};

/**
 * Шорткат для проверки ролей:
 * router.get('/admin', requireRoles('admin'), handler)
 */
export const requireRoles = (...roles) => authenticate({ roles });
