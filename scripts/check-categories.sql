-- Check what's in the categories table (admin categories)
SELECT * FROM categories ORDER BY name_et;

-- Check what's in product_categories table
SELECT * FROM product_categories LIMIT 50;

-- Check what category_slugs exist in product_categories
SELECT DISTINCT category_slug FROM product_categories;

-- Check products in 'esiletostetud' category
SELECT p.id, p.slug, p.name, p.published 
FROM products p
JOIN product_categories pc ON p.id = pc.product_id
WHERE pc.category_slug = 'esiletostetud';