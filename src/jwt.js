const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const SECRET = process.env.JWT_SECRET || 'dev-secret';

const usedTokens = new Map();

function signToken() {
  return jwt.sign(
    {
      sub: 'banco-pichincha-assessment',
      jti: uuidv4(),
    },
    SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '60s',
    }
  );
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = {
  signToken,
  verifyToken,
  usedTokens,
};