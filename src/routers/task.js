const express = require('express');
const TaskModel = require('../models/task');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.post('/tasks', authMiddleware, async (req, res) => {
  const { body, user: { _id } } = req;

  const task = new TaskModel({
    ...body,
    owner: _id
  });

  try {
    await task.save();

    res.status(201)
       .send(task);
  } catch (err) {
    res.status(400)
       .send(err);
  }
});

router.get('/tasks', authMiddleware, async (req, res) => {
  const { user, query } = req;

  const match = {};
  const sort = {};

  if (query.completed) {
    match.completed = query.completed === 'true';
  }

  if (query.sortBy) {
    const [sortBy, order] = query.sortBy.split('_');

    sort[sortBy] = order === 'desc' ? -1 : 1;
  }

  try {
    await user.populate({
      match,
      path: 'tasks',
      options: {
        sort,
        limit: parseInt(query.limit, 10),
        skip: parseInt(query.skip, 10)
      }
    }).execPopulate();

    res.send(user.tasks);
  } catch {
    res.status(500)
       .send();
  }
});

router.get('/tasks/:id', authMiddleware, async (req, res) => {
  const { id: _id } = req.params;

  try {
    const task = await TaskModel.findOne({ _id, owner: req.user._id });

    if (!task) {
      res.status(404)
         .send();
      return;
    }

    res.send(task);
  } catch {
    res.status(500)
       .send();
  }
});

router.patch('/tasks/:id', authMiddleware, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    res.status(400)
       .send({
         error: {
           message: 'Invalid updates'
         }
       });
    return;
  }

  const { id: _id } = req.params;

  try {
    const task = await TaskModel.findOne({ _id, owner: req.user._id });

    if (!task) {
      res.status(404)
         .send();
      return;
    }

    updates.forEach(update => task[update] = req.body[update]);
    await task.save();

    res.send(task);
  } catch (e) {
    res.status(400)
       .send(e);
  }
});

router.delete('/tasks/:id', authMiddleware, async (req, res) => {
  const { id: _id } = req.params;

  try {
    const task = await TaskModel.findOneAndDelete({ _id, owner: req.user._id });

    if (!task) {
      res.status(404)
         .send();
      return;
    }

    res.send(task);
  } catch {
    res.status(500)
       .send();
  }
});

module.exports = router;
