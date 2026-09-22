const courseService = require('../services/courseService');

async function createCourse(req, res, next) {
  try {
    const course = await courseService.createCourse(req.user.id, req.body);
    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (err) {
    next(err);
  }
}

async function getMyCourses(req, res, next) {
  try {
    const courses = await courseService.getCoursesForUser(req.user);
    res.status(200).json({ courses });
  } catch (err) {
    next(err);
  }
}

async function getCourseById(req, res, next) {
  try {
    const course = await courseService.getCourseById(req.params.id, req.user);
    res.status(200).json({ course });
  } catch (err) {
    next(err);
  }
}

async function enrollStudent(req, res, next) {
  try {
    const result = await courseService.enrollStudent(req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getCourseAnalytics(req, res, next) {
  try {
    const analytics = await courseService.getCourseAnalytics(req.params.id, req.user);
    res.status(200).json({ analytics });
  } catch (err) {
    next(err);
  }
}

async function getCourseAssignments(req, res, next) {
  try {
    const assignments = await courseService.getCourseAssignments(req.params.id, req.user);
    res.status(200).json({ assignments });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCourse,
  getMyCourses,
  getCourseById,
  enrollStudent,
  getCourseAnalytics,
  getCourseAssignments
};
