import { Routes, Route } from "react-router-dom";
import Header from "@/components/Header/Header";
import Home from "@/pages/Home/Home";
import Shop from "@/pages/Shop/Shop";
import ProductDetail from "@/pages/ProductDetail/ProductDetail";
import Cart from "@/pages/Cart/Cart";
import Login from "@/pages/Login/Login";
import Orders from "@/pages/Orders/Orders";
import Checkout from "@/pages/Checkout/Checkout";
import Admin from "@/pages/Admin/Admin";

function App() {
  return (
    <>
    <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/checkout" element={<Checkout/>}/>
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </>
  );
}

export default App;