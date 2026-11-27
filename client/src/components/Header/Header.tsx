import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/auth/useAuth";
import { useCart } from "@/context/cart/useCart";
import SearchBox from "@/components/SearchBox/SearchBox";
import styles from "./Header.module.css";

function Header() {
  const { totalCount } = useCart();
  const { user, isAdmin } = useAuth();

  // The search that is in the URL right now (only on the Shop page)
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentSearch = location.pathname === "/shop" ? searchParams.get("search") ?? "" : "";

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
          {/* "key" gives a fresh box when the URL's search changes (e.g. after "Clear filters") */}
          <SearchBox key={currentSearch} initialValue={currentSearch} />

          {user && (
            <Link to="/wishlist" className={styles.iconButton} aria-label="Wishlist">
              ♡
            </Link>
          )}

          <Link
            to={user ? "/account" : "/login"}
            className={styles.iconButton}
            aria-label={user ? "My account" : "Log in"}
          >
            {user ? user.name.charAt(0).toUpperCase() : "👤"}
          </Link>

          <Link to="/cart" className={styles.cartButton} aria-label="Cart">
            🛒
            <span className={styles.badge}>{totalCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
