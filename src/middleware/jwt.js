const { verifyToken, isTokenUsed, markTokenAsUsed } = require('../jwt');

module.exports = (req, res, next) => {
  const token = req.header('X-JWT-KWY');

  if (!token) {
    return res.status(401).send();
  }

  try {
    const payload = verifyToken(token);

    if (isTokenUsed(payload.jti)) {
      return res.status(401).send();
    }

    markTokenAsUsed(payload.jti);

    next();
  } catch {
    return res.status(401).send();
  }
};
