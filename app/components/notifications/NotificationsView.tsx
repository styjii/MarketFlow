import {
  Bell,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
  CheckCheck,
  ShoppingBag,
  Star,
  Heart,
} from "lucide-react";
import { useFetcher, useNavigate } from "react-router";
import type { NotificationItem, NotificationKind } from "~/types/notifications";

// ─── Icône selon kind + orderStatus ──────────────────────────
function NotifIcon({ kind, orderStatus }: { kind: NotificationKind; orderStatus?: string }) {
  if (kind === "review") return <Star className="w-5 h-5 text-warning" />;
  if (kind === "like")   return <Heart className="w-5 h-5 text-error" />;
  if (kind === "order_seller") return <ShoppingBag className="w-5 h-5 text-secondary" />;

  // order_buyer : icône selon statut
  switch (orderStatus) {
    case "paid":      return <CheckCircle2 className="w-5 h-5 text-success" />;
    case "shipped":   return <Truck        className="w-5 h-5 text-info" />;
    case "delivered": return <Package      className="w-5 h-5 text-primary" />;
    case "cancelled": return <XCircle      className="w-5 h-5 text-error" />;
    case "pending":   return <Clock        className="w-5 h-5 text-warning" />;
    default:          return <Bell         className="w-5 h-5 text-base-content/50" />;
  }
}

// ─── Badge de catégorie ───────────────────────────────────────
function KindBadge({ kind }: { kind: NotificationKind }) {
  const map: Record<NotificationKind, { label: string; cls: string }> = {
    order_buyer:  { label: "Ma commande",  cls: "badge-primary"   },
    order_seller: { label: "Vente",        cls: "badge-secondary" },
    review:       { label: "Avis",         cls: "badge-warning"   },
    like:         { label: "Like",         cls: "badge-error"     },
  };
  const { label, cls } = map[kind];
  return (
    <span className={`badge badge-outline badge-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ─── Couleur de l'icône-container selon kind ─────────────────
function iconBg(kind: NotificationKind, read: boolean) {
  if (read) return "bg-base-200";
  const map: Record<NotificationKind, string> = {
    order_buyer:  "bg-primary/10",
    order_seller: "bg-secondary/10",
    review:       "bg-warning/10",
    like:         "bg-error/10",
  };
  return map[kind];
}

// ─── Composant principal ──────────────────────────────────────
export const NotificationsView = ({
  notifications,
}: {
  notifications: NotificationItem[];
  userId: string;
}) => {
  const fetcher = useFetcher();
  const navigate = useNavigate();

  // Optimistic reads
  const optimisticKeys = new Set<string>();
  if (fetcher.formData) {
    const intent = fetcher.formData.get("intent");
    if (intent === "mark_all_read") {
      notifications.forEach((n) => optimisticKeys.add(n.key));
    }
    if (intent === "mark_read") {
      const k = fetcher.formData.get("key") as string;
      if (k) optimisticKeys.add(k);
    }
  }

  const isRead = (n: NotificationItem) => n.isRead || optimisticKeys.has(n.key);

  const unreadItems = notifications.filter((n) => !isRead(n));
  const unreadCount = unreadItems.length;
  const unreadKeys  = unreadItems.map((n) => n.key);

  const handleClick = (n: NotificationItem) => {
    if (!isRead(n)) {
      fetcher.submit(
        { intent: "mark_read", key: n.key },
        { method: "post" }
      );
    }
    navigate(n.destination);
  };

  const handleMarkAllRead = () => {
    if (unreadKeys.length === 0) return;
    fetcher.submit(
      { intent: "mark_all_read", keys: JSON.stringify(unreadKeys) },
      { method: "post" }
    );
  };

  const displayedUnread =
    fetcher.formData?.get("intent") === "mark_all_read" ? 0 : unreadCount;

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

        {unreadKeys.length > 0 &&
          fetcher.formData?.get("intent") !== "mark_all_read" && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-ghost btn-sm gap-2 opacity-70 hover:opacity-100"
            >
              <CheckCheck size={15} />
              Tout marquer comme lu
            </button>
          )}
      </div>

      {/* ── Liste ── */}
      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => {
            const read = isRead(n);
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => handleClick(n)}
                className={`
                  w-full text-left rounded-2xl border transition-all duration-200
                  hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]
                  ${read
                    ? "bg-base-100 border-base-200 opacity-55"
                    : "bg-base-100 border-primary/20 shadow-sm ring-1 ring-primary/10"
                  }
                `}
              >
                <div className="p-4 flex items-start gap-3">
                  {/* Icône */}
                  <div className={`shrink-0 p-2.5 rounded-xl transition-colors ${iconBg(n.kind, read)}`}>
                    <NotifIcon kind={n.kind} orderStatus={n.orderStatus} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-sm leading-tight ${read ? "text-base-content/55" : "text-base-content"}`}>
                          {n.title}
                        </p>
                        <KindBadge kind={n.kind} />
                      </div>
                      {/* Point bleu non-lu */}
                      {!read && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-0.5" />
                      )}
                    </div>

                    <p className="text-xs text-base-content/50 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    <p className="text-[11px] text-base-content/30 pt-0.5">
                      {n.created_at}
                    </p>
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
          <p className="text-sm opacity-40 text-center max-w-xs mt-1">
            Les activités sur vos commandes et produits apparaîtront ici.
          </p>
        </div>
      )}
    </div>
  );
};
