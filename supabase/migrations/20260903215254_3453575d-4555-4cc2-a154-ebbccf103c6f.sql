
CREATE TYPE public.order_status AS ENUM ('new','preparing','ready','served','cancelled');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'food',
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_key text,
  tags text,
  is_available boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu is publicly readable" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_label text NOT NULL,
  status public.order_status NOT NULL DEFAULT 'new',
  total numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders are readable" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update order status" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);
GRANT SELECT, INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items are readable" ON public.order_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.menu_items (name, description, category, price, image_key, tags, is_featured, sort_order) VALUES
('Miso Ramen Bowl','Silky broth, soft-boiled egg, chashu and a sprinkle of chilli oil. Comfort in a bowl.','food',14.00,'hero-ramen','broth · egg · chashu', true, 1),
('Rainbow Poke','Fresh salmon, avocado and edamame over sushi rice.','food',12.50,'poke','salmon · avocado · edamame', false, 2),
('Buttermilk Stacks','Fluffy pancakes with maple syrup and berries.','food',9.00,'pancakes','maple · berries · cream', false, 3),
('Tempura Shrimp','Crispy shrimp tempura with ponzu dip.','food',11.00,'tempura','6 pc · ponzu dip', false, 4),
('Matcha Panna','Matcha panna cotta with pistachio and cherry.','food',7.50,'panna-cotta','pistachio · cherry', false, 5),
('Iced Matcha Latte','Stone-ground matcha over ice with oat milk.','drink',5.50,NULL,'oat milk · iced', false, 6),
('Yuzu Lemonade','Sparkling yuzu lemonade with mint.','drink',4.50,NULL,'sparkling · mint', false, 7),
('Hojicha Cold Brew','Roasted green tea cold brew, lightly sweet.','drink',5.00,NULL,'roasted · smooth', false, 8);
