import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as applicationApi from '../../api/applicationApi';

export const applyToDriveAction = createAsyncThunk(
  'applications/apply',
  async (driveId, thunkAPI) => {
    try {
      return await applicationApi.applyToDrive(driveId);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getMyApplicationsAction = createAsyncThunk(
  'applications/getMy',
  async (_, thunkAPI) => {
    try {
      return await applicationApi.getMyApplications();
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  applications: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

const applicationSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    resetApplicationState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearApplications: (state) => {
      state.applications = [];
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyToDriveAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(applyToDriveAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload?.message || 'Application submitted successfully';
        // Immediately prepend the new application so the dashboard stats
        // and Applications page update without a separate re-fetch.
        if (action.payload?.data) {
          state.applications.unshift(action.payload.data);
        }
      })
      .addCase(applyToDriveAction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to submit application';
      })
      .addCase(getMyApplicationsAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMyApplicationsAction.fulfilled, (state, action) => {
        state.isLoading = false;
        // Safe fallback to [] if data is missing or malformed
        state.applications = action.payload?.data ?? [];
      })
      .addCase(getMyApplicationsAction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to fetch applications';
      });
  },
});

export const { resetApplicationState, clearApplications } = applicationSlice.actions;
export default applicationSlice.reducer;
