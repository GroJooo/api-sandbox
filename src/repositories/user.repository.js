  const User = require('../models/user.model');

  const create = async (data) => {
    const user = new User(data);
    return user.save();
  };

  const findById = async (id) => {
    return User.findById(id).select('-__v');
  };

  const findByEmail = async (email) => {
    return User.findOne({ email }).select('+password');
  };

  const findAll = async ({ page, limit, sort }) => {
    return User.find()
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v');
  };

  const count = async () => {
    return User.countDocuments();
  };

  const update = async (id, data) => {
    return User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    }).select('-__v');
  };

  const remove = async (id) => {
    return User.findByIdAndDelete(id);
  };

  const getStats = async () => {
    return User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  };

  module.exports = { create, findById, findByEmail, findAll, count, update, remove, getStats };