import { createClient } from "~/lib/supabase.server";
import { data } from "react-router";
import type { Order } from "~/types/order";

type PaymentPayload = {
  payment_method: string;
  card_number: string;
  expiry_date: string;
  cardholder_name: string;
  shipping_address?: string;
};

async function restoreStock(
  supabase: ReturnType<typeof createClient>["supabase"],
  orderItems: { product_id: string; quantity: number }[]
) {
  for (const item of orderItems) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.product_id)
      .single();

    if (product) {
      await supabase
        .from("products")
        .update({ stock_quantity: product.stock_quantity + item.quantity })
        .eq("id", item.product_id);
    }
  }
}

export async function performGetBuyerOrders(request: Request) {
  const { supabase, headers } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Response("Non autorisé", { status: 401, headers });

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      buyer_id,
      total_amount,
      status,
      created_at,
      shipping_address,
      order_items (
        id,
        product_id,
        quantity,
        unit_price,
        product:product_id (title, price)
      )
    `
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Response(error.message, { status: 500, headers });

  return data({ orders: (orders as unknown as Order[]) || [] }, { headers });
}

export async function performDeleteOrder(request: Request, orderId: string) {
  const { supabase, headers } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Response("Non autorisé", { status: 401, headers });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      id,
      buyer_id,
      status,
      order_items (product_id, quantity)
    `
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order)
    throw new Response("Commande non trouvée", { status: 404, headers });

  if (order.buyer_id !== user.id)
    throw new Response("Non autorisé", { status: 403, headers });

  if (order.status === "paid" || order.status === "shipped" || order.status === "delivered") {
    await restoreStock(supabase, order.order_items);

    const { error: deletePaymentError } = await supabase
      .from("payments")
      .delete()
      .eq("order_id", orderId);

    if (deletePaymentError) {
      console.error("Erreur suppression paiement lors de la suppression de commande :", deletePaymentError);
    }
  }

  const { error: deleteError } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (deleteError)
    throw new Response("Erreur lors de la suppression de la commande", {
      status: 500,
      headers,
    });

  return data({ success: true }, { headers });
}

export async function performPayOrder(
  request: Request,
  orderId: string,
  paymentData: PaymentPayload
) {
  const { supabase, headers } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Response("Non autorisé", { status: 401, headers });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      id,
      buyer_id,
      status,
      total_amount,
      shipping_address,
      order_items (product_id, quantity)
    `
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order)
    throw new Response("Commande non trouvée", { status: 404, headers });

  if (order.buyer_id !== user.id)
    throw new Response("Non autorisé", { status: 403, headers });

  if (order.status !== "pending")
    throw new Response("Commande déjà payée ou annulée", {
      status: 400,
      headers,
    });

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existingPayment)
    throw new Response("Un paiement existe déjà pour cette commande", {
      status: 400,
      headers,
    });

  const { data: profile } = await supabase
    .from("profiles")
    .select("shipping_address")
    .eq("id", user.id)
    .maybeSingle();

  const shippingAddress =
    paymentData.shipping_address || profile?.shipping_address;
  if (!shippingAddress)
    throw new Response("Adresse de livraison requise", {
      status: 400,
      headers,
    });

  // Vérifier le stock et le décrémenter
  for (const item of order.order_items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.product_id)
      .single();

    if (!product || product.stock_quantity < item.quantity)
      throw new Response("Stock insuffisant pour un article", {
        status: 400,
        headers,
      });

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: product.stock_quantity - item.quantity })
      .eq("id", item.product_id);

    if (updateError)
      throw new Response("Erreur lors de la mise à jour du stock", {
        status: 500,
        headers,
      });
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: orderId,
    amount: order.total_amount,
    payment_method: paymentData.payment_method,
    card_number: paymentData.card_number.replace(/\s/g, "").slice(-4),
    expiry_date: paymentData.expiry_date,
    cardholder_name: paymentData.cardholder_name,
  });

  if (paymentError)
    throw new Response("Erreur lors de l'enregistrement du paiement", {
      status: 500,
      headers,
    });

  const { error: updateOrderError } = await supabase
    .from("orders")
    .update({ status: "paid", shipping_address: shippingAddress })
    .eq("id", orderId);

  if (updateOrderError)
    throw new Response("Erreur lors de la mise à jour de la commande", {
      status: 500,
      headers,
    });

  return data({ success: true }, { headers });
}

export async function performOrderAction(request: Request) {
  const formData = await request.formData();
  const actionType = formData.get("action") as string;
  const orderId = formData.get("orderId") as string;

  if (!orderId) {
    const { headers } = createClient(request);
    return data({ error: "ID de commande manquant" }, { headers });
  }

  try {
    if (actionType === "delete") {
      await performDeleteOrder(request, orderId);
    } else if (actionType === "pay") {
      const paymentData: PaymentPayload = {
        payment_method: (formData.get("payment_method") as string) || "card",
        card_number: (formData.get("card_number") as string) || "",
        expiry_date: (formData.get("expiry_date") as string) || "",
        cardholder_name: (formData.get("cardholder_name") as string) || "",
        shipping_address: (formData.get("shipping_address") as string) || undefined,
      };

      await performPayOrder(request, orderId, paymentData);
    } else {
      const { headers } = createClient(request);
      return data({ error: "Action non reconnue" }, { headers });
    }

    // Retourner la liste mise à jour après succès
    return await performGetBuyerOrders(request);
  } catch (error: any) {
    const { headers } = createClient(request);
    return data(
      { error: error.message || "Erreur lors de l'opération" },
      { headers }
    );
  }
}