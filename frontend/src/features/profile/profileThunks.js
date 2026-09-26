import { createAsyncThunk } from '@reduxjs/toolkit';
import * as profileApi from '../../api/profileApi';

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await profileApi.getMyProfile();
      return data.data.profile;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Failed to fetch profile' }
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const { data } = await profileApi.updateMyProfile(profileData);
      return data.data.profile;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Failed to update profile' }
      );
    }
  }
);

export const uploadResume = createAsyncThunk(
  'profile/uploadResume',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await profileApi.uploadResume(formData);
      return data.data.resumeUrl;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Failed to upload resume' }
      );
    }
  }
);

export const deleteResume = createAsyncThunk(
  'profile/deleteResume',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await profileApi.deleteResume();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Failed to delete resume' }
      );
    }
  }
);
