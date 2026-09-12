const API_KEY = process.env.API_KEY;

module.exports = (req, res, next) => {
  const apiKey = req.header('X-Parse-REST-API-Key');

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).send();
  }

  next();
};
