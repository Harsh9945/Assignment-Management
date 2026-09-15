const groupService = require('../services/groupService');

async function searchStudents(req, res, next) {
  try {
    const query = req.query.q || '';
    const students = await groupService.searchStudents(query, req.user.id);
    res.status(200).json({ students });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  searchStudents
};
