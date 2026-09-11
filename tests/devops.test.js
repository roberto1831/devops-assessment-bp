const request = require('supertest');
const app = require('../src/app');

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
});