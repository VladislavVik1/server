import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// ✅ Грузим .env ДО чтения process.env
dotenv.config();

/**
 * authenticate({ roles: ['admin', 'responder'], allowCookie: true })
 * Кладёт в req.user: { id, email, role, iat, exp }
 *
 * ✅ КЛЮЧЕВАЯ ПОПРАВКА:
 * раньше JWT_SECRET читался на уровне модуля ДО загрузки dotenv
 * (импортом из другого файла), из-за чего становился 'dev_secret'
 * и verify падал 401. Теперь секрет читается после dotenv и при каждом вызове.
 */
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
    if (!token) return res.status(401).json({ message: 'Нет токена' });

    const payload = jwt.verify(token, getSecret());

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

export const requireRoles = (...roles) => authenticate({ roles });
