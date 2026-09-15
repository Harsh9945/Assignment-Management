const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userRepo = require('../repositories/userRepo');
const groupRepo = require('../repositories/groupRepo');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      studentId: user.student_id
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

async function register({ name, email, studentId, password }) {
  const existingEmail = await userRepo.findByEmail(email);
  if (existingEmail) {
    const error = new Error('A user with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const existingStudentId = await userRepo.findByStudentId(studentId);
  if (existingStudentId) {
    const error = new Error('A user with this student ID already exists');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepo.createUser({
    name,
    email,
    studentId,
    passwordHash,
    role: 'STUDENT'
  });

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.student_id,
      role: user.role,
      createdAt: user.created_at
    },
    token
  };
}

async function login({ identifier, password }) {
  let user = await userRepo.findByEmail(identifier);
  if (!user) {
    user = await userRepo.findByStudentId(identifier);
  }

  if (!user) {
    const error = new Error('Invalid email/student ID or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email/student ID or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.student_id,
      role: user.role
    },
    token
  };
}

async function getProfile(userId) {
  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  let activeGroup = null;
  if (user.role === 'STUDENT') {
    activeGroup = await groupRepo.findUserActiveGroup(userId);
  }

  return {
    user,
    activeGroup
  };
}

module.exports = {
  register,
  login,
  getProfile
};
