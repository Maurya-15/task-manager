const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

jest.setTimeout(120000);

let app;
let mongoServer;

/**
 * Builds a valid future ISO date string (tomorrow) for due date tests.
 *
 * @returns {string}
 */
const futureIsoDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  process.env.JWT_SECRET = 'jest-jwt-secret-key-for-tests-only';

  const connectDB = require('../src/config/db');
  await connectDB();

  // eslint-disable-next-line global-require
  app = require('../src/app');
});

afterEach(async () => {
  const Task = require('../src/models/Task');
  await Task.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Task API', () => {
  it('POST /api/v1/tasks returns 201 on valid input', async () => {
    const payload = {
      title: 'Write integration tests',
      description: 'Use Jest and Supertest',
      category: 'work',
      dueDate: futureIsoDate(),
    };

    const res = await request(app)
      .post('/api/v1/tasks')
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.title).toBe(payload.title);
    expect(res.body.data.isCompleted).toBe(false);
  });

  it('POST /api/v1/tasks returns 422 when title is missing', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .send({ description: 'No title' })
      .expect(422);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('GET /api/v1/tasks returns 200 with pagination metadata', async () => {
    const Task = require('../src/models/Task');
    await Task.create([
      { title: 'Task One Here', category: 'work' },
      { title: 'Task Two Here', category: 'personal' },
    ]);

    const res = await request(app)
      .get('/api/v1/tasks?page=1&limit=10')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(10);
    expect(res.body.data.tasks).toHaveLength(2);
  });

  it('GET /api/v1/tasks/:id returns 404 for non-existent task', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/v1/tasks/${id}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Task not found');
  });

  it('GET /api/v1/tasks/:id returns 400 for invalid ObjectId', async () => {
    const res = await request(app)
      .get('/api/v1/tasks/not-a-valid-id')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid task ID format');
  });

  it('PATCH /api/v1/tasks/:id/complete returns 400 if already completed', async () => {
    const Task = require('../src/models/Task');
    const task = await Task.create({ title: 'Done Task Here', isCompleted: true });

    const res = await request(app)
      .patch(`/api/v1/tasks/${task._id}/complete`)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Task is already marked as completed. No changes were made.');
  });

  it('DELETE /api/v1/tasks/:id returns 200 on success', async () => {
    const Task = require('../src/models/Task');
    const task = await Task.create({ title: 'To Delete Task' });

    const res = await request(app)
      .delete(`/api/v1/tasks/${task._id}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Task deleted successfully');
  });

  it('DELETE /api/v1/tasks/:id returns 404 for non-existent task', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/v1/tasks/${id}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Task not found');
  });
});
