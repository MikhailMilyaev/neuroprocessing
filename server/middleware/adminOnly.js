module.exports = function adminOnly() {
  return (req, res, next) => {
    const role = req.user?.role || req.user?.dataValues?.role;  
    if (role !== 'ADMIN') return res.status(403).json({ message: 'forbidden' });
    next();
  };
};
