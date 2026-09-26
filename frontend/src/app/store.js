import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import profileReducer from '../features/profile/profileSlice';
import driveReducer from '../features/drives/driveSlice';
import applicationReducer from '../features/applications/applicationSlice';
import noticeReducer from '../features/notices/noticeSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    drives: driveReducer,
    applications: applicationReducer,
    notices: noticeReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
