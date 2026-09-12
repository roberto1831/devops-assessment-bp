const express = require('express');

const apiKey = require('../middleware/apiKey');
const jwtMiddleware = require('../middleware/jwt');

const devopsSchema = require('../schemas/devops');
const { signToken } = require('../jwt');

const router = express.Router();

router.post('/token', apiKey, (req, res) => {
  return res.status(200).json({
    token: signToken(),
  });
});

router.post('/DevOps', apiKey, jwtMiddleware, (req, res) => {
  const validation = devopsSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).send();
  }

  return res.status(200).json({
    message: `Hello ${req.body.to} your message will be send`,
  });
});

router.get('/DevOps', (req, res) => {
  return res.send('ERROR');
});

router.put('/DevOps', (req, res) => {
  return res.send('ERROR');
});

router.patch('/DevOps', (req, res) => {
  return res.send('ERROR');
});

router.delete('/DevOps', (req, res) => {
  return res.send('ERROR');
});

router.get('/health', (req, res) => {
  return res.status(200).send('OK');
});

module.exports = router;
