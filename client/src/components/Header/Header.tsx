import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth";
import { useCart } from "@/context/cart/useCart";
import styles from "./Header.module.css";

function Header() {
  const { totalCount } = useCart();
  const { user, isAdmin } = useAuth();
  
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
                   {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className={styles.actions}>
          <input
            type="search"
            placeholder="Search plants"
            className={styles.search}
          />

          <Link to="/login" className={styles.iconButton}>
            {user ? user.name.charAt(0).toUpperCase() : "👤"}
          </Link>

          <Link to="/cart" className={styles.cartButton}>
            🛒
            <span className={styles.badge}>{totalCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;