
CREATE TYPE public.complaint_status AS ENUM ('open','in_progress','resolved');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','refunded','failed');

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'waiter',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.employees TO anon;
GRANT SELECT ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees are readable" ON public.employees FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.order_employee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'waiter',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, employee_id, role)
);
CREATE INDEX order_employee_assignments_order_idx ON public.order_employee_assignments(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_employee_assignments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_employee_assignments TO authenticated;
GRANT ALL ON public.order_employee_assignments TO service_role;
ALTER TABLE public.order_employee_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assignments are readable" ON public.order_employee_assignments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can assign staff" ON public.order_employee_assignments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can change assignments" ON public.order_employee_assignments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can remove assignments" ON public.order_employee_assignments FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  table_label text,
  category text NOT NULL DEFAULT 'other',
  message text NOT NULL,
  status public.complaint_status NOT NULL DEFAULT 'open',
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.complaints TO anon;
GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Complaints are readable" ON public.complaints FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can file a complaint" ON public.complaints FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update complaints" ON public.complaints FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  score integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ratings_score_range CHECK (score BETWEEN 1 AND 5)
);
GRANT SELECT, INSERT ON public.ratings TO anon;
GRANT SELECT, INSERT ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings are readable" ON public.ratings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can leave a rating" ON public.ratings FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'card',
  status public.payment_status NOT NULL DEFAULT 'pending',
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON public.payments(order_id);
GRANT SELECT, INSERT, UPDATE ON public.payments TO anon;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payments are readable" ON public.payments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can record a payment" ON public.payments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update a payment" ON public.payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.order_employee_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.employees (full_name, role) VALUES
('Ada Obi','waiter'),
('Tomiwa Bello','waiter'),
('Chef Nkechi','chef'),
('Sam Idris','manager');
