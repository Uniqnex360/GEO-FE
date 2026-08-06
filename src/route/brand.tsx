// routes/BrandRoutes.jsx

import { Route } from "react-router-dom";

import BrandList from "../pages/Brand/BrandList";
import Brand_Chat from "../pages/BrandChat/Brand_Chat";
import BrandChatList from "../pages/BrandChat/BrandChatList";
import BrandAnalyticsDetail from "../pages/BrandChat/BrandChatDetail";

const BrandRoutes = (
  <>
    <Route path="brand" element={<BrandList />} />
    <Route path="brand-chat" element={<Brand_Chat />} />
    <Route path="brand-chat/list" element={<BrandChatList />} />
    <Route path="brand-chat/:brandId" element={<BrandAnalyticsDetail />} />
  </>
);

export default BrandRoutes;
