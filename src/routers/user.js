const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const UserModel = require('../models/user');
const authMiddlware = require('../middlewares/auth');
const { sendWelcomeEmail, sendFarewellEmail } = require('../emails/account');

const router = new express.Router();

const avatarUpload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error('Please upload an image in .jpg, .jpeg, .png format'));
      return;
    }

    cb(null, true);
  }
});

router.post('/users', async (req, res) => {
  const user = new UserModel(req.body);

  try {
    await user.save();

    const { email, name } = user;
    sendWelcomeEmail(email, name);

    const token = await user.generateAuthToken();

    res.status(201)
       .send({ user, token });
  } catch (err) {
    res.status(400)
       .send(err);
  }
});

router.post('/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findByCredentials(email, password);
    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (err) {
    res.status(400)
       .send();
  }
});

router.post('/users/logout', authMiddlware, async (req, res) => {
  const { user, token: currentSessionToken } = req;

  try {
    user.tokens = user.tokens.filter(({ token }) => token !== currentSessionToken);

    await user.save();

    res.send();
  } catch {
    res.status(500)
       .send();
  }
});

router.post('/users/logoutAll', authMiddlware, async (req, res) => {
  const { user } = req;

  try {
    user.tokens = [];

    await user.save();

    res.send();
  } catch {
    res.status(500)
       .send();
  }
});

router.get('/users/me', authMiddlware, async (req, res) => {
  res.send(req.user);
});

router.patch('/users/me', authMiddlware, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
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

  const { user } = req;

  try {
    updates.forEach(update => user[update] = req.body[update]);
    await user.save();

    if (!user) {
      res.status(404)
         .send();
      return;
    }

    res.send(user);
  } catch (err) {
    res.status(400)
       .send(err);
  }
});

router.delete('/users/me', authMiddlware, async (req, res) => {
  try {
    await req.user.remove();

    const { email, name } = req.user;
    sendFarewellEmail(email, name);

    res.send(req.user);
  } catch {
    res.status(500)
       .send();
  }
});

router.post(
  '/users/me/avatar',
  authMiddlware,
  avatarUpload.single('avatar'),
  async (req, res) => {
    const { user, file } = req;

    user.avatar = await sharp(file.buffer).resize({ width: 250, height: 250 })
                                          .png()
                                          .toBuffer();
    await user.save();

    res.send();
  },
  (error, req, res, next) => {
    res.status(400)
       .send({
         error: {
           message: error.message
         }
       });
  }
);

router.delete('/users/me/avatar', authMiddlware, async (req, res) => {
  const { user } = req;

  user.avatar = undefined;
  await user.save();

  res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserModel.findById(id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch {
    res.status(404)
       .send();
  }
});

module.exports = router;
