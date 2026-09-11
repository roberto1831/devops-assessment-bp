function normalizeQuotes(req, res, next) {
  if (typeof req.body === 'string') {
    req.body = req.body
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
  }

  next();
}

module.exports = normalizeQuotes;