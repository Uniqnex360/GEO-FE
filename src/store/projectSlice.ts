import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

interface ProjectState {
  globalProjectId: number | null;
}

const initialState: ProjectState = {
  globalProjectId: null,
};

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setGlobalProjectId: (state, action: PayloadAction<number | null>) => {
      state.globalProjectId = action.payload;
    },
  },
});

export const { setGlobalProjectId } = projectSlice.actions;

// Selectors
export const selectGlobalProjectId = (state: RootState) =>
  state.project.globalProjectId;

export default projectSlice.reducer;
