export function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      nombre: req.session.userNombre,
      email: req.session.userEmail,
    };
    return next();
  }
  return res.status(401).json({ error: 'No autenticado' });
}
