import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as noticeApi from '../../api/noticeApi';

// ── Async Thunks ─────────────────────────────────────────────────────

/**
 * Fetch notices — used by the dashboard (limit: 3) and the full notices page
 * params: { limit, page, category }
 */
export const getNotices = createAsyncThunk(
  'notices/getAll',
  async (params, thunkAPI) => {
    try {
      return await noticeApi.fetchNotices(params);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

/**
 * Fetch a single notice by ID — used by the detail view
 */
export const getNoticeById = createAsyncThunk(
  'notices/getOne',
  async (id, thunkAPI) => {
    try {
      return await noticeApi.fetchNoticeById(id);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

/**
 * Fetch the list of notice IDs the logged-in user has read (from backend)
 */
export const fetchReadNotices = createAsyncThunk(
  'notices/fetchRead',
  async (_, thunkAPI) => {
    try {
      return await noticeApi.fetchReadNotices();
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

/**
 * Mark a notice as read — persisted on the backend (syncs across devices)
 */
export const markNoticeAsRead = createAsyncThunk(
  'notices/markRead',
  async (id, thunkAPI) => {
    try {
      await noticeApi.markNoticeRead(id);
      return id; // Return the ID so the reducer can update state immediately
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ── Initial State ─────────────────────────────────────────────────────

const initialState = {
  notices: [],       // Array of notice objects for lists
  currentNotice: null, // Single notice for detail view
  total: 0,          // Total count (for pagination in Phase 4)
  isLoading: false,
  isError: false,
  message: '',
  readNotices: [],   // Populated from backend API, NOT localStorage
};

// ── Slice ─────────────────────────────────────────────────────────────

export const noticeSlice = createSlice({
  name: 'notices',
  initialState,
  reducers: {
    resetNoticeState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
    clearCurrentNotice: (state) => {
      state.currentNotice = null;
    },
    clearNotices: (state) => {
      state.notices = [];
      state.currentNotice = null;
      state.total = 0;
      state.isLoading = false;
      state.isError = false;
      state.message = '';
      state.readNotices = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // getNotices
      .addCase(getNotices.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(getNotices.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns { notices, total, page, pages } inside data
        state.notices = action.payload.data.notices;
        state.total = action.payload.data.total;
      })
      .addCase(getNotices.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // getNoticeById
      .addCase(getNoticeById.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(getNoticeById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentNotice = action.payload.data;
      })
      .addCase(getNoticeById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // fetchReadNotices
      .addCase(fetchReadNotices.fulfilled, (state, action) => {
        state.readNotices = action.payload.data.readNotices.map((id) => id.toString());
      })

      // markNoticeAsRead
      .addCase(markNoticeAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        if (!state.readNotices.includes(id)) {
          state.readNotices.push(id);
        }
      });
  },
});

export const { resetNoticeState, clearCurrentNotice, clearNotices } = noticeSlice.actions;
export default noticeSlice.reducer;
