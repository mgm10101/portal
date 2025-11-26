-- Add sort_order column to classes, streams, and team_colours tables
-- Run this SQL in your Supabase SQL Editor

-- Add sort_order to classes table
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Initialize sort_order for existing classes (by id order)
UPDATE classes 
SET sort_order = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as row_num 
  FROM classes
) AS subquery
WHERE classes.id = subquery.id
AND classes.sort_order IS NULL;

-- Add sort_order to streams table
ALTER TABLE streams 
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Initialize sort_order for existing streams (by id order)
UPDATE streams 
SET sort_order = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as row_num 
  FROM streams
) AS subquery
WHERE streams.id = subquery.id
AND streams.sort_order IS NULL;

-- Add sort_order to team_colours table
ALTER TABLE team_colours 
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Initialize sort_order for existing team colours (by id order)
UPDATE team_colours 
SET sort_order = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as row_num 
  FROM team_colours
) AS subquery
WHERE team_colours.id = subquery.id
AND team_colours.sort_order IS NULL;

