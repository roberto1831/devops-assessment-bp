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

function isTokenUsed(jti) {
  return usedTokens.has(jti);
}

function markTokenAsUsed(jti) {
  usedTokens.set(jti, Date.now());
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = {
  signToken,
  verifyToken,
  usedTokens,
  isTokenUsed,
  markTokenAsUsed,
};