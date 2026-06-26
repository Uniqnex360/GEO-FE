import { Route } from "react-router-dom";

import AISandbox from "../pages/AI_Sandbox/AISandbox";

const AISandboxRoutes = (
  <>
    <Route path="ai-sandbox" element={<AISandbox />} />
  </>
);

export default AISandboxRoutes;
