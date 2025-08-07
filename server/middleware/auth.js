// ./middleware/auth.js
import jwt from 'jsonwebtoken';

/**
 * Мидлвар для защиты маршрутов и проверки ролей.
 * @param {string[]} [allowedRoles] — массив разрешённых ролей (если не указан, проверяется только валидность токена)
 */
export function authenticate(allowedRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Нет токена' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Неверный токен' });
    }

    // Если указаны роли, проверяем, что роль пользователя в списке allowedRoles
    if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }

    // Кладём данные пользователя в req.user
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };

    next();
  };
}
