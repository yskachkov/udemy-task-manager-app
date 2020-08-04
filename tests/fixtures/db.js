const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');

const firstUserId = new mongoose.Types.ObjectId();
const firstUser = {
  _id: firstUserId,
  name: 'First User',
  email: 'test1@example.com',
  password: 'test12345!',
  tokens: [{
    token: jwt.sign({ _id: firstUserId }, process.env.JWT_SECRET)
  }]
};
const secondUserId = new mongoose.Types.ObjectId();
const secondUser = {
  _id: secondUserId,
  name: 'Second User',
  email: 'test2@example.com',
  password: 'test123456!',
  tokens: [{
    token: jwt.sign({ _id: secondUserId }, process.env.JWT_SECRET)
  }]
};
const firstTask = {
  _id: new mongoose.Types.ObjectId(),
  description: 'First task',
  completed: false,
  owner: firstUserId
};
const secondTask = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Second task',
  completed: false,
  owner: firstUserId
};
const thirdTask = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Third task',
  completed: false,
  owner: secondUserId
};

const setupDatabase = async () => {
  await User.deleteMany();
  await Task.deleteMany();

  await new User(firstUser).save();
  await new User(secondUser).save();

  await new Task(firstTask).save();
  await new Task(secondTask).save();
  await new Task(thirdTask).save();
};

module.exports = {
  firstUserId,
  firstUser,
  secondUser,
  firstTask,
  setupDatabase
};
