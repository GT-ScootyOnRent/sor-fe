import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const STORAGE_KEY = 'dashboard_selected_city';

interface DashboardCityState {
  selectedCityId: number | 'all';
}

// Load initial state from localStorage
const getInitialState = (): DashboardCityState => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return {
        selectedCityId: stored === 'all' ? 'all' : parseInt(stored, 10),
      };
    }
  }
  return { selectedCityId: 'all' };
};

const dashboardCitySlice = createSlice({
  name: 'dashboardCity',
  initialState: getInitialState(),
  reducers: {
    setDashboardCity: (state, action: PayloadAction<number | 'all'>) => {
      state.selectedCityId = action.payload;
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(action.payload));
      }
    },
  },
});

export const { setDashboardCity } = dashboardCitySlice.actions;

// Selector to get cityId param for API calls (undefined means all)
export const selectDashboardCityIdParam = (state: { dashboardCity: DashboardCityState }) =>
  state.dashboardCity.selectedCityId === 'all' ? undefined : state.dashboardCity.selectedCityId;

export const selectDashboardCityId = (state: { dashboardCity: DashboardCityState }) =>
  state.dashboardCity.selectedCityId;

export default dashboardCitySlice.reducer;
