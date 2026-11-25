import { Link, NavLink } from "react-router-dom";
import styles from "./Header.module.css";

// The Header needs one prop: a number for the cart badge
type HeaderProps = {
  cartCount: number;
};

function Header({ cartCount }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          🌿 Leaf &amp; Clay
        </Link>

        <nav className={styles.nav}>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/shop?category=Indoor">Indoor</NavLink>
<NavLink to="/shop?category=Outdoor">Outdoor</NavLink>
          <NavLink to="/orders">My Orders</NavLink>
        </nav>

        <div className={styles.actions}>
          <input
            type="search"
            placeholder="Search plants"
            className={styles.search}
          />

          <Link to="/login" className={styles.iconButton}>
            👤
          </Link>

          <Link to="/cart" className={styles.cartButton}>
            🛒
            <span className={styles.badge}>{cartCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;