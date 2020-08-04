const jwt = require('jsonwebtoken');
const UserModel = require('../models/user');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const { _id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findOne({ _id, 'tokens.token': token });

    if (!user) {
      throw new Error('');
    }

    req.user = user;
    req.token = token;

    next();
  } catch {
    res.status(401)
       .send({
         error: {
           message: 'Please authenticate.'
         }
       });
  }
};

module.exports = auth;
