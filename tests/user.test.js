const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { firstUserId, firstUser, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

it('Should signup a new user', async () => {
  const response = await request(app)
    .post('/users').send({
      name: 'admin',
      email: 'yevhenii.skachkov@gmail.com',
      password: 'admin12345!'
    })
    .expect(201);
  const user = await User.findById(response.body.user._id);

  expect(user).not.toBeNull();
  expect(response.body).toMatchObject({
    user: {
      name: 'admin',
      email: 'yevhenii.skachkov@gmail.com'
    },
    token: user.tokens[0].token
  });
  expect(user.password).not.toBe('admin12345!');
});

it('Should login an existing user', async () => {
  const response = await request(app)
    .post('/users/login')
    .send({
      email: firstUser.email,
      password: firstUser.password
    })
    .expect(200);
  const user = await User.findById(firstUserId);

  expect(response.body.token).toBe(user.tokens[1].token);
});

it('Should not login a non-existing user', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: firstUser.email,
      password: 'test'
    })
    .expect(400);
});

it('Should get profile for a user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${firstUser.tokens[0].token}`)
    .send()
    .expect(200);
});

it('Should not get profile for an unauthenticated user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401);
});

it('Should delete account for a user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${firstUser.tokens[0].token}`)
    .send()
    .expect(200);
});

it('Should not delete account for unauthenticated user', async () => {
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401);
});

it('Should upload an avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${firstUser.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);
  const user = await User.findById(firstUserId);

  expect(user.avatar).toEqual(expect.any(Buffer));
});

it('Should update valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${firstUser.tokens[0].token}`)
    .send({
      name: 'superuser'
    })
    .expect(200);
  const user = await User.findById(firstUserId);

  expect(user.name).toBe('superuser');
});

it('Should not update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${firstUser.tokens[0].token}`)
    .send({
      location: 'Germany'
    })
    .expect(400);
});
