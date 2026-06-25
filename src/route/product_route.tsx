// routes/ProductRoutes.jsx

import { Route } from "react-router-dom";

import Product from "../pages/Product/Product";

const ProductRoutes = (
  <>
    <Route path="product" element={<Product />} />
  </>
);

export default ProductRoutes;
