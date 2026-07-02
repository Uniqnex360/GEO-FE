import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "./index.css";

import AppRouter from "./route/index.tsx";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 1. Import Redux bindings
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
// Adjust this path to wherever your store file is located
import { store, persistor } from "./store/store";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* 2. Wrap everything inside the Redux Provider */}
      <Provider store={store}>
        {/* 3. Wrap inside the PersistGate to handle local storage hydration */}
        <PersistGate loading={null} persistor={persistor}>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
          />
          <AppRouter />
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  </StrictMode>,
);
