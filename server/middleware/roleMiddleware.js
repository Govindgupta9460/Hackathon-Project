const roleMiddleware = (...allowedRoles) => {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user profile not attached' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access forbidden: Role '${req.user.role}' does not have permission to access this resource`
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
