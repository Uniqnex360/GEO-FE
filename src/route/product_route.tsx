// routes/ProductRoutes.jsx

import { Route } from "react-router-dom";

import Product from "../pages/Product/Product";
import ProductDetail from "../pages/Product/ProductDetail";

const ProductRoutes = (
  <>
    <Route path="product" element={<Product />} />
    <Route path="product/:id" element={<ProductDetail />} />
  </>
);

export default ProductRoutes;
