import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface StaffUser {
    id: number;
    username: string;
    email: string;
    number: string;
    cityId: number;
    cityName?: string;
    canOfflineBook: boolean;
    hasChangedPassword: boolean;
    profilePicUrl?: string;
}

interface StaffAuthState {
    staff: StaffUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// Staff info stored in localStorage for UI persistence
const storedStaff = localStorage.getItem('staff');

const initialState: StaffAuthState = {
    staff: storedStaff ? JSON.parse(storedStaff) : null,
    isAuthenticated: !!storedStaff,
    isLoading: false,
};

const staffAuthSlice = createSlice({
    name: 'staffAuth',
    initialState,
    reducers: {
        setStaffCredentials: (
            state,
            action: PayloadAction<{ staff: StaffUser }>
        ) => {
            state.staff = action.payload.staff;
            state.isAuthenticated = true;
            state.isLoading = false;

            // Store staff info for UI persistence (tokens in HttpOnly cookies)
            localStorage.setItem('staff', JSON.stringify(action.payload.staff));
            localStorage.setItem('staffId', action.payload.staff.id.toString());
        },
        updateStaffProfile: (
            state,
            action: PayloadAction<Partial<StaffUser>>
        ) => {
            if (state.staff) {
                state.staff = { ...state.staff, ...action.payload };
                localStorage.setItem('staff', JSON.stringify(state.staff));
            }
        },
        staffLogout: (state) => {
            state.staff = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            localStorage.removeItem('staff');
            localStorage.removeItem('staffId');
        },
        setStaffLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        markStaffPasswordChanged: (state) => {
            if (state.staff) {
                state.staff.hasChangedPassword = true;
                localStorage.setItem('staff', JSON.stringify(state.staff));
            }
        },
    },
});

export const {
    setStaffCredentials,
    updateStaffProfile,
    staffLogout,
    setStaffLoading,
    markStaffPasswordChanged,
} = staffAuthSlice.actions;

export default staffAuthSlice.reducer;
