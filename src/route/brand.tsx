// routes/BrandRoutes.jsx

import { Route } from "react-router-dom";

import BrandList from "../pages/Brand/BrandList";

const BrandRoutes = (
  <>
    <Route path="brand" element={<BrandList />} />
  </>
);

export default BrandRoutes;
