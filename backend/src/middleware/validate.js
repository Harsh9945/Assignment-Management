const { z } = require('zod');

/**
 * Middleware factory for Zod validation
 * @param {z.ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} source 
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return res.status(400).json({
          message: 'Validation failed',
          errors: formattedErrors
        });
      }
      next(err);
    }
  };
}

// Schemas
const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  studentId: z.string().trim().min(1, 'Student ID is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or Student ID is required'),
  password: z.string().min(1, 'Password is required')
});

const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(100, 'Group name too long')
});

const addMemberSchema = z.object({
  studentIdentifier: z.string().trim().min(1, 'Email or Student ID is required')
});

const createAssignmentSchema = z.object({
  courseId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().min(1, 'Description is required'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Due date must be a valid date/time'
  }),
  onedriveUrl: z.string().trim().url('OneDrive link must be a valid URL'),
  submissionType: z.enum(['INDIVIDUAL', 'GROUP']).default('INDIVIDUAL'),
  targetType: z.enum(['ALL_STUDENTS', 'SPECIFIC_GROUPS']).default('ALL_STUDENTS'),
  groupIds: z.array(z.string().uuid()).optional()
}).refine((data) => {
  if (data.targetType === 'SPECIFIC_GROUPS') {
    return Array.isArray(data.groupIds) && data.groupIds.length > 0;
  }
  return true;
}, {
  message: 'At least one group must be selected when targeting specific groups',
  path: ['groupIds']
});

const updateAssignmentSchema = z.object({
  courseId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().min(1).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Due date must be a valid date/time'
  }).optional(),
  onedriveUrl: z.string().trim().url('OneDrive link must be a valid URL').optional(),
  submissionType: z.enum(['INDIVIDUAL', 'GROUP']).optional(),
  targetType: z.enum(['ALL_STUDENTS', 'SPECIFIC_GROUPS']).optional(),
  groupIds: z.array(z.string().uuid()).optional()
}).refine((data) => {
  if (data.targetType === 'SPECIFIC_GROUPS' && data.groupIds !== undefined) {
    return Array.isArray(data.groupIds) && data.groupIds.length > 0;
  }
  return true;
}, {
  message: 'At least one group must be selected when targeting specific groups',
  path: ['groupIds']
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createGroupSchema,
  addMemberSchema,
  createAssignmentSchema,
  updateAssignmentSchema
};
