import { createSlice } from '@reduxjs/toolkit';

interface AdminAuthState {
  hasChangedPassword: boolean;
}

const storedHasChanged = localStorage.getItem('adminHasChangedPassword');

const initialState: AdminAuthState = {
  hasChangedPassword: storedHasChanged === 'true',
};

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    markPasswordChanged: (state) => {
      state.hasChangedPassword = true;
      localStorage.setItem('adminHasChangedPassword', 'true');
    },
    resetPasswordChangeFlag: (state) => {
      state.hasChangedPassword = false;
      localStorage.removeItem('adminHasChangedPassword');
    },
  },
});

export const { markPasswordChanged, resetPasswordChangeFlag } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;