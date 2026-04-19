const { getAuth } = require('@clerk/express');
const config = require('../config');

module.exports = (req, res, next) => {
  if (!config.ENABLE_CLERK_AUTH) {
    req.auth = req.auth || { userId: 'demo-user' };
    return next();
  }

  const auth = getAuth(req);

  if (!auth?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.auth = auth;
  next();
};
