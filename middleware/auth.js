const { admin, initialized } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  if (!initialized) {
    return res
      .status(503)
      .json({ error: 'Auth not configured: Firebase credentials are missing on the server.' });
  }

  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { verifyToken };
