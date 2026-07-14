import { Route } from "react-router-dom";

import AdminSettings from "../pages/AdminSettings/AdminSettings";

const AdminSettingsRoutes = (
  <>
    <Route path="settings" element={<AdminSettings />} />
  </>
);

export default AdminSettingsRoutes;
