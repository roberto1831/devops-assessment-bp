const express = require('express');
const { signToken } = require('./jwt');

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
