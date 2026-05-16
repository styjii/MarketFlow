import {
  Bell,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
  CheckCheck,
} from "lucide-react";
import { useFetcher, useNavigate } from "react-router";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  status: string;
  orderId: string;
  isRead: boolean;
  /** true si la commande contient un produit vendu par l'utilisateur connecté */
  isSeller: boolean;
};

// ─── Icône selon statut ───────────────────────────────────────
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "paid":
      return <CheckCircle2 className="w-5 h-5 text-success" />;
    case "shipped":
      return <Truck className="w-5 h-5 text-info" />;
    case "delivered":
      return <Package className="w-5 h-5 text-primary" />;
    case "cancelled":
      return <XCircle className="w-5 h-5 text-error" />;
    case "pending":
      return <Clock className="w-5 h-5 text-warning" />;
    default:
      return <Bell className="w-5 h-5 text-base-content/70" />;
  }
}

// ─── Composant principal ──────────────────────────────────────
export const NotificationsView = ({
  notifications,
  userId,
}: {
  notifications: NotificationItem[];
  userId: string;
}) => {
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unreadOrderIds = notifications
    .filter((n) => !n.isRead)
    .map((n) => n.orderId);

  // Optimistic reads : ensemble des IDs marqués "en cours" côté client
  const optimisticReadIds = new Set<string>();
  if (fetcher.formData) {
    const intent = fetcher.formData.get("intent");
    if (intent === "mark_all_read") {
      notifications.forEach((n) => optimisticReadIds.add(n.orderId));
    }
    if (intent === "mark_read") {
      const id = fetcher.formData.get("orderId") as string;
      if (id) optimisticReadIds.add(id);
    }
  }

  const isRead = (n: NotificationItem) =>
    n.isRead || optimisticReadIds.has(n.orderId);

  // Destination au clic :
  //   - vendeur → /dashboard/products (page produit dans le dashboard)
  //   - acheteur → /orders
  const getDestination = (n: NotificationItem) =>
    n.isSeller
      ? `/dashboard/orders`
      : `/orders`;

  const handleClick = (notification: NotificationItem) => {
    if (!isRead(notification)) {
      fetcher.submit(
        { intent: "mark_read", orderId: notification.orderId },
        { method: "post" }
      );
    }
    navigate(getDestination(notification));
  };

  const handleMarkAllRead = () => {
    if (unreadOrderIds.length === 0) return;
    fetcher.submit(
      { intent: "mark_all_read", orderIds: JSON.stringify(unreadOrderIds) },
      { method: "post" }
    );
  };

  const displayedUnread =
    unreadCount -
    (fetcher.formData?.get("intent") === "mark_all_read" ? unreadCount : 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {displayedUnread > 0 && (
            <span className="badge badge-primary badge-sm font-bold">
              {displayedUnread} non lue{displayedUnread > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {unreadOrderIds.length > 0 &&
          fetcher.formData?.get("intent") !== "mark_all_read" && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-ghost btn-sm gap-2 opacity-70 hover:opacity-100"
            >
              <CheckCheck size={16} />
              Tout marquer comme lu
            </button>
          )}
      </div>

      {/* ── Liste ── */}
      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const read = isRead(notification);
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleClick(notification)}
                className={`
                  w-full text-left rounded-2xl border transition-all duration-200
                  hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]
                  ${
                    read
                      ? "bg-base-100 border-base-200 opacity-60"
                      : "bg-base-100 border-primary/20 shadow-sm ring-1 ring-primary/10"
                  }
                `}
              >
                <div className="p-4 flex items-start gap-4">
                  {/* Icône statut */}
                  <div
                    className={`shrink-0 p-2.5 rounded-xl transition-colors ${
                      read ? "bg-base-200" : "bg-primary/10"
                    }`}
                  >
                    <StatusIcon status={notification.status} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`font-semibold text-sm leading-tight ${
                          read ? "text-base-content/60" : "text-base-content"
                        }`}
                      >
                        {notification.title}
                      </p>

                      {/* Point bleu non-lu */}
                      {!read && (
                        <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>

                    <p className="text-xs text-base-content/50 leading-relaxed line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-base-content/35">
                      <span>Commande #{notification.orderId.slice(0, 8)}</span>
                      <span>{notification.created_at}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-base-200/50 rounded-3xl border-2 border-dashed border-base-300">
          <div className="bg-base-100 p-4 rounded-full shadow-inner mb-4">
            <Bell className="w-10 h-10 opacity-20" />
          </div>
          <p className="text-lg font-semibold opacity-60">Aucune notification</p>
          <p className="text-sm opacity-40 text-center max-w-xs">
            Vos alertes de commande et mises à jour seront affichées ici.
          </p>
        </div>
      )}
    </div>
  );
};
