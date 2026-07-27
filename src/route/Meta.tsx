import { Route } from "react-router-dom";

import Taxonomy from "../pages/Meta/Taxonomy";

const MetaRoutes = (
  <>
    <Route path="category" element={<Taxonomy />} />
  </>
);

export default MetaRoutes;
