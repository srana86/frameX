-- FrameX PostgreSQL Initialization Script
-- This runs when the container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- (Prisma will handle most schema, but we can add some pg-specific optimizations)

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'FrameX database initialized successfully';
END $$;
