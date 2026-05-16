import { createClient } from "~/lib/supabase.server";
import type { Order, OrderStatus } from "~/types/order";
import { data } from "react-router";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  status: OrderStatus;
  orderId: string;
  isRead: boolean;
  /** true si cette commande appartient au vendeur connecté (dashboard link) */
  isSeller: boolean;
};

// ─────────────────────────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────────────────────────
export async function performGetNotifications(request: Request) {
  const { supabase, headers } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Response("Non autorisé", { status: 401, headers });

  // Commandes de l'utilisateur (en tant qu'acheteur)
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, total_amount, created_at")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Response(error.message, { status: 500, headers });

  // IDs des notifications déjà lues
  const { data: reads } = await supabase
    .from("notification_reads")
    .select("order_id")
    .eq("user_id", user.id);

  const readSet = new Set((reads ?? []).map((r) => r.order_id));

  // Produits vendus par l'utilisateur (pour détecter ses propres produits dans les orders)
  const { data: sellerProducts } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", user.id);

  const sellerProductIds = new Set((sellerProducts ?? []).map((p) => p.id));

  // Pour chaque order, vérifier si un item appartient au vendeur connecté
  // (simplification : on récupère order_items en masse)
  const orderIds = (orders as unknown as Order[]).map((o) => o.id);
  let sellerOrderIds = new Set<string>();

  if (sellerProductIds.size > 0 && orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, product_id")
      .in("order_id", orderIds);

    sellerOrderIds = new Set(
      (items ?? [])
        .filter((item) => sellerProductIds.has(item.product_id))
        .map((item) => item.order_id)
    );
  }

  const notifications: NotificationItem[] = (orders as unknown as Order[]).map(
    (order) => {
      const orderRef = `#${order.id.slice(0, 8)}`;
      const formattedDate = new Date(order.created_at).toLocaleDateString(
        "fr-FR",
        {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      let title = "Mise à jour de commande";
      let message = "Votre commande a été mise à jour.";

      switch (order.status) {
        case "pending":
          title = "Paiement en attente";
          message = `Votre commande ${orderRef} attend le paiement. Montant total ${order.total_amount} €.`;
          break;
        case "paid":
          title = "Commande payée";
          message = `Votre commande ${orderRef} a été payée. Préparez-vous à la recevoir bientôt.`;
          break;
        case "shipped":
          title = "Commande expédiée";
          message = `Votre commande ${orderRef} a quitté l'entrepôt et est en cours de livraison.`;
          break;
        case "delivered":
          title = "Commande livrée";
          message = `Votre commande ${orderRef} a été livrée avec succès.`;
          break;
        case "cancelled":
          title = "Commande annulée";
          message = `Votre commande ${orderRef} a été annulée. Contactez le support si nécessaire.`;
          break;
        default:
          title = "Mise à jour de commande";
          message = `Votre commande ${orderRef} a été mise à jour.`;
      }

      return {
        id: order.id,
        title,
        message,
        created_at: formattedDate,
        status: order.status,
        orderId: order.id,
        isRead: readSet.has(order.id),
        isSeller: sellerOrderIds.has(order.id),
      };
    }
  );

  return data({ notifications, userId: user.id }, { headers });
}

// ─────────────────────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────────────────────
export async function performNotificationsAction(request: Request) {
  const { supabase, headers } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Response("Non autorisé", { status: 401, headers });

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // ── Marquer UNE notification comme lue ──────────────────────
  if (intent === "mark_read") {
    const orderId = formData.get("orderId") as string;
    if (!orderId) return data({ success: false }, { headers });

    await supabase
      .from("notification_reads")
      .upsert(
        { user_id: user.id, order_id: orderId },
        { onConflict: "user_id,order_id" }
      );

    return data({ success: true, intent: "mark_read" }, { headers });
  }

  // ── Tout marquer comme lu ────────────────────────────────────
  if (intent === "mark_all_read") {
    const rawIds = formData.get("orderIds") as string;
    const orderIds: string[] = JSON.parse(rawIds ?? "[]");

    if (orderIds.length > 0) {
      const rows = orderIds.map((order_id) => ({
        user_id: user.id,
        order_id,
      }));
      await supabase
        .from("notification_reads")
        .upsert(rows, { onConflict: "user_id,order_id" });
    }

    return data({ success: true, intent: "mark_all_read" }, { headers });
  }

  return data({ success: false, message: "Action inconnue." }, { headers });
}
