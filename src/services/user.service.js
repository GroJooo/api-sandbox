  const userRepository = require('../repositories/user.repository');
  const { MAX_PAGE_LIMIT, DEFAULT_PAGE, DEFAULT_LIMIT } = require('../config/environment');

  const create = async (data) => {
    return userRepository.create(data);
  };

  const getAll = async (query) => {
    const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
    const sort = query.sort || '-createdAt';

    const [total, users] = await Promise.all([
      userRepository.count(),
      userRepository.findAll({ page, limit, sort })
    ]);

    return {
      count: users.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: users
    };
  };

  const getById = async (id) => {
    return userRepository.findById(id);
  };

  const update = async (id, data) => {
    return userRepository.update(id, data);
  };

  const remove = async (id) => {
    return userRepository.remove(id);
  };

  module.exports = { create, getAll, getById, update, remove };