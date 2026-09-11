module.exports = (req, res, next) => {
  const apiKey = req.header('X-Parse-REST-API-Key');

  if (!apiKey) {
    return res.status(401).send();
  }

  next();
};