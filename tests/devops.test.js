const request = require('supertest');
const app = require('../src/app');
const { verifyToken } = require('../src/jwt');

describe('DevOps API', () => {
  test('POST /DevOps without API key returns 401', async () => {
    const response = await request(app)
      .post('/DevOps')
      .send({
        message: 'This is a test',
        to: 'Juan Perez',
        from: 'Rita Asturia',
        timeToLifeSec: 45,
      });

    expect(response.status).toBe(401);
  });

  test('POST /DevOps with API key but missing JWT returns 401', async () => {
    const response = await request(app)
      .post('/DevOps')
      .set('X-Parse-REST-API-Key', 'valid-api-key')
      .send({
        message: 'This is a test',
        to: 'Juan Perez',
        from: 'Rita Asturia',
        timeToLifeSec: 45,
      });

    expect(response.status).toBe(401);
  });

  test('POST /token without API key returns 401', async () => {
    const response = await request(app).post('/token');

    expect(response.status).toBe(401);
  });

  test('POST /token with API key returns a valid token', async () => {
    const response = await request(app)
      .post('/token')
      .set('X-Parse-REST-API-Key', 'valid-api-key');

    expect(response.status).toBe(200);

    const decoded = verifyToken(response.body.token);

    expect(decoded.jti).toBeDefined();
  });
});