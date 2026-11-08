import * as s from '../services/applicationService.js';
export const apply = async (req, res) =>
  res.status(201).json({ data: await s.apply(req.user.id, req.validated) });
export const mine = async (req, res) =>
  res.json({ data: await s.myApplications(req.user.id, req.validated) });
export const forJob = async (req, res) =>
  res.json({ data: await s.jobApplications(req.params.jobId, req.user.id, req.validated) });
export const status = async (req, res) =>
  res.json({ data: await s.updateStatus(req.params.id, req.user.id, req.validated.status) });
