  const userService = require('../services/user.service');

  const create = async (req, res) => {
    const user = await userService.create(req.body);
    res.status(201).json({ success: true, data: user });
  };

  const list = async (req, res) => {
    const result = await userService.getAll(req.query);
    res.json({ success: true, ...result });
  };

  const getById = async (req, res) => {
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "Utilisateur non trouve" });
    }
    res.json({ success: true, data: user });
  };

  const update = async (req, res) => {
    const user = await userService.update(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ success: false, error: "Utilisateur non trouve" });
    }
    res.json({ success: true, data: user });
  };

  const remove = async (req, res) => {
    const user = await userService.remove(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "Utilisateur non trouve" });
    }
    res.status(204).send();
  };

  module.exports = { create, list, getById, update, remove };
