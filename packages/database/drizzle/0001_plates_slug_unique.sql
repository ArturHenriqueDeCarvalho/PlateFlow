-- Ensure ON CONFLICT (slug) works for batch upserts (DrizzlePlateRepository.createBatch).
-- If duplicate slugs exist, keep the newest row and rename older ones so the unique index can apply.
WITH ranked AS (
  SELECT
    id,
    slug,
    ROW_NUMBER() OVER (
      PARTITION BY slug
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
    ) AS rn
  FROM plates
)
UPDATE plates AS p
SET
  slug = p.slug || '-dup-' || substr(replace(p.id, 'plate-', ''), 1, 8),
  updated_at = now()
FROM ranked AS r
WHERE p.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS plates_slug_uidx ON plates (slug);
