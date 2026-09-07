import { create } from 'zustand';

interface OnboardingState {
  hasOnboarded: boolean | null;
  setHasOnboarded: (value: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasOnboarded: null,
  setHasOnboarded: (value) => set({ hasOnboarded: value }),
}));
