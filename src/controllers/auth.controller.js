  const authService = require('../services/auth.service');

  const register = async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: user });
  };

  const login = async (req, res) => {
    const token = await authService.login(req.body);
    if (!token) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    res.json({ success: true, token });
  };

  module.exports = { register, login };