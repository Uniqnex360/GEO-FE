import { Route } from "react-router-dom";

import Chat from "../pages/Chat/Chat";


const ChatRoutes = (
  <>
    <Route path="chat" element={<Chat />} />
  </>
);

export default ChatRoutes;