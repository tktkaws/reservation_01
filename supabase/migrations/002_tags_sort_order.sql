-- Add display order for tags
ALTER TABLE tags
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Initialize sort_order by current name order for existing rows
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 AS rn
  FROM tags
)
UPDATE tags
SET sort_order = ordered.rn
FROM ordered
WHERE tags.id = ordered.id;
