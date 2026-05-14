-- Run this in OLD Supabase SQL Editor
-- Copy the entire output and run it in NEW Supabase SQL Editor

SELECT
  'CREATE TABLE IF NOT EXISTS public.' || quote_ident(t.table_name) || ' (' ||
  string_agg(
    quote_ident(c.column_name) || ' ' ||
    CASE
      WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name
      WHEN c.data_type = 'character varying' THEN 'text'
      WHEN c.data_type = 'ARRAY' THEN replace(c.udt_name, '_', '') || '[]'
      WHEN c.data_type = 'integer' AND c.column_default LIKE 'nextval%' THEN 'serial'
      WHEN c.data_type = 'bigint' AND c.column_default LIKE 'nextval%' THEN 'bigserial'
      ELSE c.data_type
    END ||
    CASE WHEN c.is_nullable = 'NO' AND c.column_default NOT LIKE 'nextval%' THEN ' NOT NULL' ELSE '' END ||
    CASE
      WHEN c.column_default IS NOT NULL AND c.column_default NOT LIKE 'nextval%'
      THEN ' DEFAULT ' || c.column_default
      ELSE ''
    END,
    ', '
    ORDER BY c.ordinal_position
  ) || ');' AS create_statement
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;
