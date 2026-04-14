import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SelectedCity {
    id: number;
    name: string;
}

interface CityState {
    selectedCity: SelectedCity | null;
    isModalOpen: boolean;
}

// Try to load from localStorage
const loadCityFromStorage = (): SelectedCity | null => {
    try {
        const stored = localStorage.getItem('selectedCity');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

const initialState: CityState = {
    selectedCity: loadCityFromStorage(),
    isModalOpen: false,
};

const citySlice = createSlice({
    name: 'city',
    initialState,
    reducers: {
        setSelectedCity: (state, action: PayloadAction<SelectedCity>) => {
            state.selectedCity = action.payload;
            state.isModalOpen = false;
            // Persist to localStorage
            localStorage.setItem('selectedCity', JSON.stringify(action.payload));
        },
        openCityModal: (state) => {
            state.isModalOpen = true;
        },
        closeCityModal: (state) => {
            state.isModalOpen = false;
        },
    },
});

export const { setSelectedCity, openCityModal, closeCityModal } = citySlice.actions;
export default citySlice.reducer;
