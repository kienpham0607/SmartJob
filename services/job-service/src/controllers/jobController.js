import * as jobs from '../services/jobService.js';
export const list = async (req, res) => res.json({ data: await jobs.listJobs(req.validated) });
export const mine = async (req, res) =>
  res.json({ data: await jobs.listJobs(req.validated, req.user.id) });
export const get = async (req, res) => res.json({ data: await jobs.getJob(req.params.id) });
export const create = async (req, res) =>
  res.status(201).json({ data: await jobs.createJob(req.validated, req.user.id) });
export const update = async (req, res) =>
  res.json({ data: await jobs.updateJob(req.params.id, req.user.id, req.validated) });
export const remove = async (req, res) => {
  await jobs.deleteJob(req.params.id, req.user.id);
  res.status(204).end();
};
export const internalList = async (req, res) =>
  res.json({ data: await jobs.openJobs(req.validated) });
