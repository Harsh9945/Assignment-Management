const progressService = require('../services/progressService');
const groupRepo = require('../repositories/groupRepo');

async function getAssignmentProgress(req, res, next) {
  try {
    const data = await progressService.getAdminAssignmentProgress(req.params.id, req.query.status);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

async function getDashboardSummary(req, res, next) {
  try {
    const summary = await progressService.getAdminDashboardSummary();
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}

async function getAllGroups(req, res, next) {
  try {
    const groups = await groupRepo.getAllGroups();
    res.status(200).json({ groups });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAssignmentProgress,
  getDashboardSummary,
  getAllGroups
};
