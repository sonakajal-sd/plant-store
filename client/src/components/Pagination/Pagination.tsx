import styles from "./Pagination.module.css";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

// "← Previous   Page 2 of 5   Next →" (hidden when everything fits on one page)
function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Pages">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        ← Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Next →
      </button>
    </nav>
  );
}

export default Pagination;
