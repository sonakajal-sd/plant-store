import styles from "./CartNotice.module.css";

type CartNoticeProps = {
  checking: boolean;
  changes: string[];
  error: string;
};

// Shows "checking…", what changed in the cart, or an error
function CartNotice({ checking, changes, error }: CartNoticeProps) {
  if (checking) {
    return <p className={styles.checking}>Checking the latest prices and stock…</p>;
  }
  if (error) {
    return <p className={styles.error}>{error}</p>;
  }
  if (changes.length === 0) {
    return null; // nothing changed → show nothing
  }
  return (
    <div className={styles.changes}>
      <strong>Your cart was updated:</strong>
      <ul>
        {changes.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

export default CartNotice;
