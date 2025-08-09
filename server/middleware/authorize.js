export const authorize = (...roles) => (req, res, next) => {
    try {
      const userRole = req.user?.role;
      if (!userRole) return res.status(401).json({ message: 'Unauthorized' });
      if (!roles.includes(userRole)) return res.status(403).json({ message: 'Forbidden' });
      next();
    } catch (e) {
      next(e);
    }
  };
  