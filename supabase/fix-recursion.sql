-- ==========================================
-- FIX: Suppression des politiques récursives
-- ==========================================

-- Désactiver RLS temporairement
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view relevant orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders with their products" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;

DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Sellers can view order items for their products" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order items" ON public.order_items;

-- ==========================================
-- NOUVELLES POLITIQUES SIMPLIFIÉES (Sans récursion)
-- ==========================================

-- COMMANDES (ORDERS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (
  auth.uid() = buyer_id
);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Authenticated users can create orders" ON public.orders FOR INSERT TO authenticated 
WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- DÉTAILS COMMANDES (ORDER_ITEMS)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);

-- ==========================================
-- Test: Créer une commande de test
-- ==========================================
-- Remplacez les UUIDs par de vrais UUIDs de test
-- SELECT * FROM public.orders LIMIT 1;
