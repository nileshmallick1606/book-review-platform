const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {
  it('should return 200 status for health check endpoint', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
