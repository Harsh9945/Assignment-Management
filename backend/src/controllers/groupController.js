const groupService = require('../services/groupService');
const progressService = require('../services/progressService');

async function createGroup(req, res, next) {
  try {
    const result = await groupService.createGroup(req.user.id, req.body.name);
    res.status(201).json({
      message: 'Group created successfully',
      group: result
    });
  } catch (err) {
    next(err);
  }
}

async function getMyGroup(req, res, next) {
  try {
    const result = await groupService.getMyGroup(req.user.id);
    res.status(200).json({
      group: result
    });
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const result = await groupService.addMember(
      req.params.id,
      req.user.id,
      req.body.studentIdentifier
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const result = await groupService.removeMember(
      req.params.id,
      req.user.id,
      req.params.userId
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getGroupProgress(req, res, next) {
  try {
    const { assignmentId } = req.query;
    if (!assignmentId) {
      return res.status(400).json({ message: 'assignmentId query parameter is required' });
    }
    const result = await progressService.getGroupProgress(req.params.id, assignmentId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createGroup,
  getMyGroup,
  addMember,
  removeMember,
  getGroupProgress
};
