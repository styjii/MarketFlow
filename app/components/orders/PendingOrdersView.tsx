import { useOutletContext, useFetcher } from "react-router";
import type { Order } from "~/types/order";
import type { Profile } from "~/types/profile";
import { 
  Bell, 
  User, 
  PackageSearch, 
  Check, 
  X, 
  Inbox, 
  Hash,
  ShoppingBag
} from "lucide-react";

interface PendingOrdersViewProps {
  orders: Order[];
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Aujourd'hui à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (isYesterday) {
    return `Hier à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
};

export const PendingOrdersView = ({ orders }: PendingOrdersViewProps) => {
  const { user } = useOutletContext<{ user: Profile }>();
  const fetcher = useFetcher();

  if (user?.role === "buyer") {
    return (
      <div className="alert alert-warning shadow-sm border-none">
        <X className="w-5 h-5" />
        <span>Seuls les vendeurs peuvent gérer les commandes.</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-base-content flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Suivi des commandes
          </h1>
          <p className="text-base-content/60 mt-1">
            Confirmez si la commande est déjà livrée ou si elle est encore en cours.
          </p>
        </div>
        {orders?.length > 0 && (
          <div className="badge badge-primary badge-lg gap-2 py-4 px-6 font-bold shadow-lg shadow-primary/20">
            {orders.length} commande{orders.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {orders && orders.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-base-200 bg-base-100 shadow-sm">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Livrée</th>
                <th>En cours</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isShipping =
                  fetcher.formData?.get("status") === "shipped" &&
                  fetcher.formData?.get("orderId") === order.id;
                const isDelivering =
                  fetcher.formData?.get("status") === "delivered" &&
                  fetcher.formData?.get("orderId") === order.id;
                const isLoading =
                  fetcher.state !== "idle" &&
                  fetcher.formData?.get("orderId") === order.id;

                const isDelivered = order.status === "delivered";
                const isInProgress = order.status === "shipped";

                return (
                  <tr key={order.id} className="hover">
                    <td>
                      <div className="font-semibold">#{order.id.slice(0, 8)}</div>
                      <div className="text-xs opacity-50">{formatDate(order.created_at)}</div>
                    </td>
                    <td>
                      <div className="font-semibold">{order.buyer?.full_name || "Client inconnu"}</div>
                      <div className="text-xs opacity-50">{order.buyer?.email}</div>
                    </td>
                    <td className="font-bold">{order.total_amount} €</td>
                    <td>
                      {isDelivered ? (
                        <span className="badge badge-success badge-sm">Oui</span>
                      ) : (
                        <span className="badge badge-ghost badge-sm">Non</span>
                      )}
                    </td>
                    <td>
                      {isInProgress ? (
                        <span className="badge badge-warning badge-sm">Oui</span>
                      ) : (
                        <span className="badge badge-ghost badge-sm">Non</span>
                      )}
                    </td>
                    <td className="text-right space-x-2">
                      {order.status !== "delivered" && (
                        <fetcher.Form method="post" className="inline-block">
                          <input type="hidden" name="orderId" value={order.id} />
                          <button
                            name="status"
                            value="delivered"
                            type="submit"
                            className="btn btn-sm btn-success"
                            disabled={isLoading}
                          >
                            {isDelivering ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Livrée"
                            )}
                          </button>
                        </fetcher.Form>
                      )}
                      {order.status !== "shipped" && order.status !== "delivered" && (
                        <fetcher.Form method="post" className="inline-block">
                          <input type="hidden" name="orderId" value={order.id} />
                          <button
                            name="status"
                            value="shipped"
                            type="submit"
                            className="btn btn-sm btn-warning"
                            disabled={isLoading}
                          >
                            {isShipping ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "En cours"
                            )}
                          </button>
                        </fetcher.Form>
                      )}
                      {order.status === "delivered" && (
                        <span className="text-xs opacity-50">Aucune action</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-base-200/30 rounded-[3rem] border-2 border-dashed border-base-300">
          <div className="bg-base-100 p-6 rounded-full shadow-xl mb-6">
            <Inbox className="w-12 h-12 text-base-content/20" />
          </div>
          <h3 className="text-xl font-bold">Tout est à jour !</h3>
          <p className="opacity-50 mt-1 max-w-xs text-center">
            Aucune commande à confirmer comme livrée ou en cours pour le moment.
          </p>
        </div>
      )}
    </div>
  );
};
