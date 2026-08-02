-- Product identity and sellable-price integrity.
-- Remove only the explicitly approved test products. Their duplicate numeric IDs
-- are shared with real products, so dependent product_id rows must remain intact.

DELETE FROM public.products WHERE sku IN ('3563456', '123456');

-- Hide products that cannot be sold safely.
UPDATE public.products
SET published = false,
    in_stock = false,
    updated_at = now()
WHERE price IS NULL
   OR price <= 0
   OR (sale_price IS NOT NULL AND sale_price <= 0);

-- Keep future imports/admin writes from publishing invalid prices.
CREATE OR REPLACE FUNCTION public.enforce_sellable_product_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.price IS NULL
     OR NEW.price <= 0
     OR (NEW.sale_price IS NOT NULL AND NEW.sale_price <= 0) THEN
    NEW.published := false;
    NEW.in_stock := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_enforce_sellable_price ON public.products;
CREATE TRIGGER products_enforce_sellable_price
BEFORE INSERT OR UPDATE OF price, sale_price, published, in_stock
ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_sellable_product_price();

-- Fail loudly if any unexpected duplicate remains before constraints are added.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.products GROUP BY id HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate products.id values remain';
  END IF;
  IF EXISTS (SELECT 1 FROM public.products WHERE sku IS NOT NULL GROUP BY sku HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate products.sku values remain';
  END IF;
  IF EXISTS (SELECT 1 FROM public.products WHERE slug IS NOT NULL GROUP BY slug HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate products.slug values remain';
  END IF;
END;
$$;

ALTER TABLE public.products ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique
  ON public.products (sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique
  ON public.products (slug) WHERE slug IS NOT NULL;

-- Explicit-ID imports can leave the serial sequence behind the table maximum.
SELECT setval(
  pg_get_serial_sequence('public.products', 'id'),
  COALESCE((SELECT max(id) FROM public.products), 1),
  true
);
