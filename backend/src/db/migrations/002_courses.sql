-- Migration 002: Courses, Submission Types, and Confirmed By
-- Joineazy DB Schema Extension for Task 2 (v3.0)

-- 1. Create Courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    professor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Course Enrollments table (M:N users <-> courses)
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_course_enrollment UNIQUE (course_id, student_id)
);

-- 3. Add course_id and submission_type columns to assignments table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='assignments' AND column_name='course_id'
    ) THEN
        ALTER TABLE assignments ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='assignments' AND column_name='submission_type'
    ) THEN
        ALTER TABLE assignments ADD COLUMN submission_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL' CHECK (submission_type IN ('INDIVIDUAL', 'GROUP'));
    END IF;
END $$;

-- 4. Add confirmed_by column to submissions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='submissions' AND column_name='confirmed_by'
    ) THEN
        ALTER TABLE submissions ADD COLUMN confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_courses_professor ON courses(professor_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
