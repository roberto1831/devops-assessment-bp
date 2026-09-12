const express = require('express');

const devopsRoutes = require('./routes/devops');

const app = express();

app.use(express.json());

app.use(devopsRoutes);

module.exports = app;
