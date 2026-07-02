import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import projectReducer from "./projectSlice";

// ==========================================
// Native Browser Storage Wrapper (Flawless in Vite)
// ==========================================
const nativeLocalStorage = {
  getItem: (key: string) => {
    return Promise.resolve(localStorage.getItem(key));
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

// 1. Combine your reducers
const rootReducer = combineReducers({
  project: projectReducer, // This matches selectGlobalProjectId
});

// 2. Persist Configuration
const persistConfig = {
  key: "root",
  storage: nativeLocalStorage, // 👈 Uses the safe, native wrapper
  whitelist: ["project"], // ONLY persist the project slice
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// 3. Configure the store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
