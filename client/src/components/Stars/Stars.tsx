import styles from "./Stars.module.css";

type StarsProps = {
  rating: number | null; // e.g. 4.3 (null = no reviews yet)
  count?: number; // how many reviews (shown in brackets)
};

// Shows ★★★★☆ (4.3) — rounded to the nearest whole star
function Stars({ rating, count }: StarsProps) {
  if (rating === null) {
    return <span className={styles.none}>No reviews yet</span>;
  }

  const full = Math.round(rating);
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      <span className={styles.filled}>{"★".repeat(full)}</span>
      <span className={styles.empty}>{"★".repeat(5 - full)}</span>
      <span className={styles.number}>
        {rating}
        {count !== undefined && ` (${count})`}
      </span>
    </span>
  );
}

export default Stars;
