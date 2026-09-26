import { createSlice } from '@reduxjs/toolkit';
import { fetchProfile, updateProfile, uploadResume, deleteResume } from './profileThunks';

const initialState = {
  profile: null,
  loading: false,
  saving: false,
  uploading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
    clearProfileState: (state) => {
      state.profile = null;
      state.loading = false;
      state.saving = false;
      state.uploading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchProfile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch profile';
      })
      // updateProfile
      .addCase(updateProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.message || 'Failed to update profile';
      })
      // uploadResume
      .addCase(uploadResume.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.uploading = false;
        if (state.profile) {
          state.profile.resumeUrl = action.payload;
        }
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload?.message || 'Failed to upload resume';
      })
      // deleteResume
      .addCase(deleteResume.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteResume.fulfilled, (state) => {
        state.saving = false;
        if (state.profile) {
          state.profile.resumeUrl = null;
          state.profile.resumePublicId = null;
        }
      })
      .addCase(deleteResume.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.message || 'Failed to delete resume';
      });
  },
});

export const { clearProfileError, clearProfileState } = profileSlice.actions;
export default profileSlice.reducer;
