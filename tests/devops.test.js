const request = require('supertest');
const app = require('../src/app');
const { verifyToken } = require('../src/jwt');
const { signToken } = require('../src/jwt');

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
  test('POST /DevOps with reused JWT returns 401', async () => {
  const token = signToken();

  await request(app)
    .post('/DevOps')
    .set('X-Parse-REST-API-Key', 'valid-api-key')
    .set('X-JWT-KWY', token)
    .send({
      message: 'This is a test',
      to: 'Juan Perez',
      from: 'Rita Asturia',
      timeToLifeSec: 45,
    });

  const secondResponse = await request(app)
    .post('/DevOps')
    .set('X-Parse-REST-API-Key', 'valid-api-key')
    .set('X-JWT-KWY', token)
    .send({
      message: 'This is a test',
      to: 'Juan Perez',
      from: 'Rita Asturia',
      timeToLifeSec: 45,
    });

  expect(secondResponse.status).toBe(401);
});

test('POST /DevOps with invalid payload returns 400', async () => {
  const token = signToken();

  const response = await request(app)
    .post('/DevOps')
    .set('X-Parse-REST-API-Key', 'valid-api-key')
    .set('X-JWT-KWY', token)
    .send({
      message: 'This is a test',
      from: 'Rita Asturia',
      timeToLifeSec: '45',
    });

  expect(response.status).toBe(400);
});

test('POST /DevOps returns greeting', async () => {
  const token = signToken();

  const response = await request(app)
    .post('/DevOps')
    .set('X-Parse-REST-API-Key', 'valid-api-key')
    .set('X-JWT-KWY', token)
    .send({
      message: 'This is a test',
      to: 'Juan Perez',
      from: 'Rita Asturia',
      timeToLifeSec: 45,
    });

  expect(response.status).toBe(200);

  expect(response.body).toEqual({
    message: 'Hello Juan Perez your message will be send',
  });
});
  
test('GET /DevOps returns ERROR', async () => {
  const response = await request(app).get('/DevOps');

  expect(response.text).toBe('ERROR');
});

test('PUT /DevOps returns ERROR', async () => {
  const response = await request(app).put('/DevOps');

  expect(response.text).toBe('ERROR');
});

test('DELETE /DevOps returns ERROR', async () => {
  const response = await request(app).delete('/DevOps');

  expect(response.text).toBe('ERROR');
});

test('PATCH /DevOps returns ERROR', async () => {
  const response = await request(app).patch('/DevOps');

  expect(response.text).toBe('ERROR');
});

});