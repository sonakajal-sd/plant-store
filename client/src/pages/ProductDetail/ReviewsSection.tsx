import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth";
import { fetchReviews, saveReview } from "@/services/reviewService";
import { formatDate } from "@/utils/format";
import Stars from "@/components/Stars/Stars";
import type { ReviewSummary } from "@/types/review";
import styles from "./ProductDetail.module.css";

// The reviews under a product: average, list, and a form for real buyers
function ReviewsSection({ productId }: { productId: number }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0); // +1 = load again (after saving)

  useEffect(() => {
    let ignore = false;
    fetchReviews(productId)
      .then((data) => {
        if (!ignore) setSummary(data);
      })
      .catch(() => {
        if (!ignore) setError("Could not load the reviews.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
    // "user" too: after logging in we learn if this customer may write a review
  }, [productId, reloadCount, user]);

  if (loading) return <p>Loading reviews…</p>;
  if (error || !summary) return <p className={styles.reviewError}>{error}</p>;

  return (
    <section className={styles.reviews}>
      <div className={styles.reviewsHeader}>
        <h2 className={styles.sectionTitle}>Reviews</h2>
        <Stars rating={summary.average} count={summary.count} />
      </div>

      {/* Who may write a review? */}
      {!user && (
        <p className={styles.reviewHint}>
          <Link to="/login">Log in</Link> to write a review.
        </p>
      )}
      {user && summary.canReview && (
        <ReviewForm
          // a fresh form after every save, filled with what they wrote
          key={reloadCount}
          productId={productId}
          initial={summary.myReview}
          onSaved={() => setReloadCount((n) => n + 1)}
        />
      )}
      {user && !summary.canReview && (
        <p className={styles.reviewHint}>You can review this plant once it has been delivered to you.</p>
      )}

      {summary.reviews.length === 0 ? (
        <p className={styles.reviewHint}>No reviews yet.</p>
      ) : (
        <ul className={styles.reviewList}>
          {summary.reviews.map((r) => (
            <li key={r.id} className={styles.review}>
              <div className={styles.reviewTop}>
                <strong>
                  {r.userName}
                  {r.isMine && " (you)"}
                </strong>
                <span className={styles.reviewDate}>{formatDate(r.updatedAt)}</span>
              </div>
              <Stars rating={r.rating} />
              <p className={styles.reviewText}>{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---- Write or edit MY review ----

type ReviewFormProps = {
  productId: number;
  initial: { rating: number; comment: string } | null;
  onSaved: () => void;
};

function ReviewForm({ productId, initial, onSaved }: ReviewFormProps) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Please choose 1 to 5 stars");
      return;
    }
    if (comment.trim().length < 3) {
      setError("Please write a few words");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await saveReview(productId, rating, comment.trim());
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form className={styles.reviewForm} onSubmit={handleSubmit}>
      <p className={styles.label}>{initial ? "Edit your review" : "Write a review"}</p>

      {/* 5 star buttons: click the 4th star = 4 stars */}
      <div className={styles.starPicker} role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={n <= rating ? styles.starOn : styles.starOff}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="How is your plant doing?"
        aria-label="Your review"
      />

      {error && <p className={styles.reviewError}>{error}</p>}

      <button type="submit" className={styles.addButton} disabled={saving}>
        {saving ? "Saving…" : initial ? "Update review" : "Post review"}
      </button>
    </form>
  );
}

export default ReviewsSection;
