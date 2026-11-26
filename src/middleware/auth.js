const jwt = require('jsonwebtoken');
module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Thiếu token' });
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof req.user.sub !== 'string' || !req.user.sub) throw new Error('Invalid subject');
    next();
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
