import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, LoginPayload, RegisterPayload, UserInfo } from "../../../types/auth";
import { loginAPI, registerAPI, getMyInfoAPI, logoutAPI } from "../../../api/authApi";

// ---- Thunks ----

// Login
export const loginUser = createAsyncThunk<
  UserInfo,
  LoginPayload,
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const data = await loginAPI(payload);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message ?? "Đăng nhập thất bại");
  }
});

// Register
export const registerUser = createAsyncThunk<
  UserInfo,
  RegisterPayload,
  { rejectValue: string }
>("auth/register", async (payload, { rejectWithValue }) => {
  try {
    const data = await registerAPI(payload);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message ?? "Đăng ký thất bại");
  }
});

// Lấy thông tin người dùng từ cookie JWT
export const fetchCurrentUser = createAsyncThunk<
  UserInfo | null,
  void,
  { rejectValue: string }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const data = await getMyInfoAPI(); 
    return data;
  } catch (err) {
    return rejectWithValue("Không thể lấy thông tin người dùng");
  }
});


// Logout
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutAPI(); // backend xóa cookie
    } catch (err) {
      return rejectWithValue("Đăng xuất thất bại");
    }
  }
);

// ---- Initial State ----
const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

// ---- Slice ----
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // --- LOGIN ---
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<UserInfo>) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload ?? "Đăng nhập thất bại";
    });

    // --- REGISTER ---
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action: PayloadAction<UserInfo>) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload ?? "Đăng ký thất bại";
    });

    // --- FETCH CURRENT USER ---
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<UserInfo | null>) => {
      state.isLoading = false;
      state.user = action.payload;
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.isLoading = false;
      state.user = null;
      state.error = action.payload ?? "Không thể xác thực người dùng";
    });

    // --- LOGOUT ---

    builder.addCase(logoutUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isLoading = false;
      state.user = null;
      state.error = null;
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload ?? "Đăng xuất thất bại";
    });

  },
});

export const { clearAuth } = authSlice.actions;
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export default authSlice.reducer;
