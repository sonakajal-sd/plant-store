import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import ProductDetail from "./pages/ProductDetail";

function App() {
  const [cartCount, setCartCount] = useState(0);

  // Adds 1 to the cart count
  function handleAddToCart(quantity:number =1) {
    setCartCount(cartCount + quantity);
  }

  return (
    <>
      <Header cartCount={cartCount} />

      <main>
        <Routes>
          <Route path="/" element={<Home onAddToCart={handleAddToCart} />} />
          <Route path="/shop" element={<Shop onAddToCart={handleAddToCart} />} /> 
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/orders" element={<Orders />} />
          <Route
  path="/product/:id"
  element={<ProductDetail onAddToCart={handleAddToCart} />}
/>
        </Routes>
      </main>
    </>
  );
}

export default App;