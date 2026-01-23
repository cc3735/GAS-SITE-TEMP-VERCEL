-- ============================================================================
-- FIX: Insert Default GAS Organization
-- ============================================================================

INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'GAS',
  'gas',
  'enterprise',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  updated_at = now();

SELECT * FROM organizations WHERE id = 'a0000000-0000-0000-0000-000000000001';
