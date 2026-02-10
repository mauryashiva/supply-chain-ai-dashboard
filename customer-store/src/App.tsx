import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { CheckoutPage } from "./pages/CheckoutPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Storefront Route */}
        <Route path="/" element={<HomePage />} />

        {/* Checkout Page Route */}
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </Router>
  );
}

export default App;
