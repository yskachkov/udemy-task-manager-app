const request = require('supertest');
const Task = require('../src/models/task');
const app = require('../src/app');
const { firstUser, secondUser, firstTask, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

it('Should create a task for a user', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${firstUser.tokens[0].token}`)
    .send({
      description: 'A task from my test'
    })
    .expect(201);
  const task = await Task.findById(response.body._id);

  expect(task).not.toBeNull();
  expect(task.description).toBe('A task from my test');
  expect(task.completed).toBeFalsy();
});

it('Should fetch user tasks', async () => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${firstUser.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body).toHaveLength(2);
});

it('', async () => {
  await request(app)
    .delete(`/tasks/${firstTask._id}`)
    .set('Authorization', `Bearer ${secondUser.tokens[0].token}`)
    .send()
    .expect(404);
  const task = await Task.findById(firstTask._id);

  expect(task).not.toBeNull();
});
