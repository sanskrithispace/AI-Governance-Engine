const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin_token_123';

export function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized — valid x-admin-token required' });
  }
  next();
}
