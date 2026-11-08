import * as users from '../services/userService.js';
export const register = async (req, res) =>
  res.status(201).json({ data: await users.register(req.validated) });
export const login = async (req, res) => res.json({ data: await users.login(req.validated) });
export const me = async (req, res) => res.json({ data: await users.findUser(req.user.id) });
export const update = async (req, res) =>
  res.json({ data: await users.updateProfile(req.user.id, req.validated) });
export const internalProfile = async (req, res) =>
  res.json({ data: await users.findUser(req.params.id) });
