import { Route } from "react-router-dom";

import CompetitorIntelligence from "../pages/Competitor/Competitor";

const CompetitorRoutes = (
  <>
    <Route path="competitor" element={<CompetitorIntelligence />} />
  </>
);

export default CompetitorRoutes;
