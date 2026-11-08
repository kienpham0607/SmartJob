import { recommend } from '../services/recommendationService.js';
export const mine = async (req, res) =>
  res.json({ data: await recommend(req.user.id, req.validated) });
