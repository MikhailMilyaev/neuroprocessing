module.exports = function adminOnly() {
  return (req, res, next) => {
    const role = req.user?.role || req.user?.dataValues?.role; // на случай, если req.user — это модель
    if (role !== 'ADMIN') return res.status(403).json({ message: 'forbidden' });
    next();
  };
};
