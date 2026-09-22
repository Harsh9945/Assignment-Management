const { z } = require('zod');
const courseRepo = require('../repositories/courseRepo');
const userRepo = require('../repositories/userRepo');
const assignmentRepo = require('../repositories/assignmentRepo');

const createCourseSchema = z.object({
  name: z.string().min(2, 'Course name must be at least 2 characters'),
  code: z.string().min(2, 'Course code must be at least 2 characters'),
  description: z.string().optional()
});

async function createCourse(professorId, data) {
  const parsed = createCourseSchema.parse(data);
  const existing = await courseRepo.findCourseByCode(parsed.code);
  if (existing) {
    const error = new Error('Course code already exists');
    error.statusCode = 400;
    throw error;
  }
  return courseRepo.createCourse({
    name: parsed.name,
    code: parsed.code.toUpperCase(),
    description: parsed.description,
    professorId
  });
}

async function getCoursesForUser(user) {
  if (user.role === 'ADMIN') {
    return courseRepo.getCoursesByProfessorId(user.id);
  } else {
    return courseRepo.getCoursesByStudentId(user.id);
  }
}

async function getCourseById(courseId, user) {
  const course = await courseRepo.findCourseById(courseId);
  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'STUDENT') {
    const isEnrolled = await courseRepo.isStudentEnrolledInCourse(courseId, user.id);
    if (!isEnrolled) {
      const error = new Error('Access denied. You are not enrolled in this course.');
      error.statusCode = 403;
      throw error;
    }
  }

  return course;
}

async function enrollStudent(courseId, { studentIdentifier }) {
  const course = await courseRepo.findCourseById(courseId);
  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  let student = await userRepo.findByEmail(studentIdentifier);
  if (!student) {
    student = await userRepo.findByStudentId(studentIdentifier);
  }

  if (!student || student.role !== 'STUDENT') {
    const error = new Error('Student not found with provided email or student ID');
    error.statusCode = 404;
    throw error;
  }

  await courseRepo.enrollStudentInCourse(courseId, student.id);
  return { message: `Student ${student.name} successfully enrolled in ${course.code}` };
}

async function getCourseAnalytics(courseId, user) {
  const course = await courseRepo.findCourseById(courseId);
  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'ADMIN' && course.professorId !== user.id) {
    // Allows admin access
  }

  return courseRepo.getCourseAnalytics(courseId);
}

async function getCourseAssignments(courseId, user) {
  // Ensure access
  await getCourseById(courseId, user);
  
  if (user.role === 'ADMIN') {
    return assignmentRepo.getAssignmentsByCourseId(courseId);
  } else {
    return assignmentRepo.getAssignmentsForStudentInCourse(courseId, user.id);
  }
}

module.exports = {
  createCourse,
  getCoursesForUser,
  getCourseById,
  enrollStudent,
  getCourseAnalytics,
  getCourseAssignments
};
