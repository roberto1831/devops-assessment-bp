const express = require('express');
const {
  signToken,
  verifyToken,
  isTokenUsed,
  markTokenAsUsed,
} = require('./jwt');

const devopsSchema = require('./schemas/devops');

const app = express();

app.use(express.json());

app.post('/DevOps', (req, res) => {
  const apiKey = req.header('X-Parse-REST-API-Key');
  const jwt = req.header('X-JWT-KWY');

  if (!apiKey) {
    return res.status(401).send();
  }

  if (!jwt) {
    return res.status(401).send();
  }

  try {
    const payload = verifyToken(jwt);

    if (isTokenUsed(payload.jti)) {
      return res.status(401).send();
    }

    markTokenAsUsed(payload.jti);
  } catch {
    return res.status(401).send();
  }

  const validation = devopsSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).send();
  }

  return res.status(200).send();
});

app.post('/token', (req, res) => {
  const apiKey = req.header('X-Parse-REST-API-Key');

  if (!apiKey) {
    return res.status(401).send();
  }

  return res.status(200).json({
    token: signToken(),
  });
});

module.exports = app;