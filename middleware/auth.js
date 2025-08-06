import jwt from 'jsonwebtoken'

export const authenticate = (roles = []) => (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).send('Access denied')
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).send('Permission denied')
    }
    next()
  } catch (err) {
    res.status(400).send('Invalid token')
  }
}
