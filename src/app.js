const express = require('express');

const app = express();

app.use(express.json());

app.post('/DevOps', (req, res) => {
  const apiKey = req.header('X-Parse-REST-API-Key');

  if (!apiKey) {
    return res.status(401).send();
  }

  return res.status(200).send();
});

module.exports = app;