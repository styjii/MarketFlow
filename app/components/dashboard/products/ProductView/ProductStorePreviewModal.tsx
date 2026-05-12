import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingCart, Star, Shield, Truck,
  ChevronLeft, ChevronRight, Heart, MessageSquare,
} from "lucide-react";
import { useFetcher } from "react-router";
import type { Product } from "~/types/products";
import { normalizeReview, type Review, type RawReview } from "~/types/reviews";
import { Avatar } from "~/components/shared/Avatar";

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProductStorePreviewModalProps {
  product: Product;
  images: string[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSelect: (i: number) => void;
  onClose: () => void;
  reviews: Review[];
  userReview: Review | null;
  isLiked: boolean;
  likeCount: number;
}

// ─── Star picker ─────────────────────────────────────────────────────────────

function StarPicker({
  value, onChange, size = 20, readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(i)}
          onMouseEnter={() => !readonly && setHovered(i)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? "cursor-default" : "cursor-pointer"}
        >
          <Star
            size={size}
            className={
              i <= (hovered || value)
                ? "text-warning fill-warning"
                : "text-base-content/20"
            }
          />
        </button>
      ))}
    </div>
  );
}

// ─── Average stars ────────────────────────────────────────────────────────────

function AverageStars({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <div className="flex items-center gap-2">
      <StarPicker value={Math.round(avg)} readonly size={13} />
      <span className="text-xs opacity-50">
        {avg.toFixed(1)} · {reviews.length} avis
      </span>
    </div>
  );
}

// ─── Review card ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const profile = review.profiles;
  const username = profile?.username ?? "Utilisateur";
  const date = new Date(review.created_at).toLocaleDateString("fr-FR");

  return (
    <div className="p-4 rounded-xl bg-base-200/50 border border-white/5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar avatarPath={profile?.avatar_url} username={profile?.username} size={28} />
          <span className="text-xs font-bold opacity-70">{username}</span>
        </div>
        <div className="flex items-center gap-2">
          <StarPicker value={review.rating} readonly size={11} />
          <span className="text-[10px] opacity-25">{date}</span>
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-base-content/60 leading-relaxed pl-9">
          {review.comment}
        </p>
      )}
    </div>
  );
}

// ─── Main modal ──────────────────────────────────────────────────────────────

export const ProductStorePreviewModal: React.FC<ProductStorePreviewModalProps> = ({
  product, images, currentIndex, onNext, onPrev, onSelect, onClose,
  reviews: initialReviews, userReview: initialUserReview,
  isLiked: initialIsLiked, likeCount: initialLikeCount,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [userReview, setUserReview] = useState<Review | null>(initialUserReview);

  const [rating, setRating] = useState(initialUserReview?.rating ?? 0);
  const [comment, setComment] = useState(initialUserReview?.comment ?? "");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const likeFetcher = useFetcher();
  const reviewFetcher = useFetcher<{ review: RawReview }>();

  const formattedPrice = new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR",
  }).format(product.price);

  useEffect(() => {
    dialogRef.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const handleLike = useCallback(() => {
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    likeFetcher.submit(
      { productId: product.id, action: next ? "like" : "unlike" },
      { method: "POST", action: "/dashboard/products/api/like" }
    );
  }, [isLiked, product.id, likeFetcher]);

  const handleReviewSubmit = useCallback(() => {
    if (rating === 0) return;
    reviewFetcher.submit(
      { productId: product.id, rating: String(rating), comment },
      { method: "POST", action: "/dashboard/products/api/review" }
    );
  }, [rating, comment, product.id, reviewFetcher]);

  useEffect(() => {
    if (reviewFetcher.state === "idle" && reviewFetcher.data?.review) {
      const saved = normalizeReview(reviewFetcher.data.review);
      setUserReview(saved);
      setReviews((prev) => {
        const exists = prev.some((r) => r.id === saved.id);
        return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev];
      });
      setShowReviewForm(false);
    }
  }, [reviewFetcher.state, reviewFetcher.data]);

  const attributes = product.attributes
    ? Object.entries(product.attributes).filter(([k, v]) => k.trim() && String(v).trim())
    : [];

  const isSubmitting = reviewFetcher.state !== "idle";

  return (
    <dialog
      ref={dialogRef}
      className="modal backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="modal-box max-w-4xl w-full p-0 overflow-hidden bg-base-100 rounded-2xl border border-base-content/10 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Banner ── */}
        <div className="bg-warning/10 border-b border-warning/20 px-6 py-2 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-widest text-warning opacity-80">
            👁 Aperçu boutique — non visible par les clients
          </span>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* ── Gallery ── */}
            <div className="p-6 space-y-4 bg-base-200/40">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-base-200 border border-base-content/5">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={images[currentIndex]}
                    src={images[currentIndex]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full object-cover"
                    alt={product.title}
                  />
                </AnimatePresence>

                {images.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-3 opacity-0 hover:opacity-100 transition-opacity">
                    <button onClick={onPrev} className="btn btn-circle btn-xs bg-black/50 border-none text-white backdrop-blur-sm">
                      <ChevronLeft size={14} />
                    </button>
                    <button onClick={onNext} className="btn btn-circle btn-xs bg-black/50 border-none text-white backdrop-blur-sm">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {product.stock_quantity > 0 && (
                  <div className="absolute top-3 left-3">
                    <span className="badge badge-success badge-sm font-bold">En stock</span>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => onSelect(i)}
                      className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        i === currentIndex ? "border-primary scale-105" : "border-transparent opacity-40 hover:opacity-80"
                      }`}
                    >
                      <img src={url} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Product info ── */}
            <div className="p-6 flex flex-col gap-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-70">
                {product.categories?.name || "Sans catégorie"}
              </div>

              <h2 className="text-2xl font-black tracking-tight leading-tight">{product.title}</h2>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-secondary">{formattedPrice}</span>
                <span className={`badge badge-outline font-bold text-xs ${product.stock_quantity > 0 ? "badge-success" : "badge-error"}`}>
                  {product.stock_quantity > 0
                    ? `${product.stock_quantity} disponible${product.stock_quantity > 1 ? "s" : ""}`
                    : "Rupture de stock"}
                </span>
              </div>

              <AverageStars reviews={reviews} />

              {product.description && (
                <p className="text-sm text-base-content/60 leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}

              {attributes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold opacity-30 tracking-widest">Caractéristiques</p>
                  <div className="flex flex-wrap gap-2">
                    {attributes.map(([key, value]) => (
                      <div key={key} className="flex items-center rounded-lg overflow-hidden border border-base-content/10 text-xs font-semibold">
                        <span className="px-2 py-1 bg-base-300 text-base-content/50 uppercase tracking-wider">{key}</span>
                        <span className="px-2 py-1 bg-base-200">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1" />

              {/* ── CTA + Like ── */}
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <button
                    disabled={product.stock_quantity === 0}
                    className="btn btn-primary flex-1 gap-2 shadow-lg shadow-primary/20"
                  >
                    <ShoppingCart size={16} /> Acheter maintenant
                  </button>
                  <button
                    onClick={handleLike}
                    className={`btn btn-square border transition-colors ${
                      isLiked
                        ? "btn-error text-white border-error"
                        : "btn-ghost border-base-content/10 hover:border-error hover:text-error"
                    }`}
                    title={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Heart size={16} className={isLiked ? "fill-current" : ""} />
                  </button>
                </div>

                {likeCount > 0 && (
                  <p className="text-[11px] opacity-40 text-center">
                    ❤️ {likeCount} personne{likeCount > 1 ? "s aiment" : " aime"} ce produit
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { icon: Shield, label: "Paiement sécurisé" },
                    { icon: Truck, label: "Livraison rapide" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-[11px] opacity-40">
                      <Icon size={12} /><span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Reviews section ── */}
          <div className="border-t border-base-content/5 px-6 py-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <MessageSquare size={14} />
                Avis clients
                {reviews.length > 0 && (
                  <span className="badge badge-sm badge-neutral">{reviews.length}</span>
                )}
              </h3>
              {/* Le formulaire n'est pas affiché dans l'aperçu — vue en lecture seule */}
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            ) : (
              <p className="text-sm text-base-content/30 text-center py-6 italic">
                Aucun avis pour l'instant.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </dialog>
  );
};
