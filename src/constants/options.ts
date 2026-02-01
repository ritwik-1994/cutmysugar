export type UserGoal = 'blood_sugar' | 'pcos' | 'avoid_spikes' | 'energy';

export const GOALS: { id: UserGoal; label: string; icon: string; description: string; tag: string }[] = [
    { id: 'blood_sugar', label: 'Manage Blood Sugar', icon: '🩸', description: 'Daily Limit: 70 GL', tag: 'Type 2 Diabetes' },
    { id: 'pcos', label: 'PCOS/PCOD Control', icon: '🌸', description: 'Daily Limit: 75 GL', tag: 'Hormonal Balance' },
    { id: 'avoid_spikes', label: 'Avoid Spikes', icon: '📉', description: 'Daily Limit: 90 GL', tag: 'Pre-diabetic' },
    { id: 'energy', label: 'Optimize Energy', icon: '⚡', description: 'Daily Limit: 110 GL', tag: 'Health Conscious' },
];

export const DIETS = [
    { id: 'veg', label: 'Vegetarian', icon: '🥗' },
    { id: 'egg', label: 'Eggetarian', icon: '🥚' },
    { id: 'non-veg', label: 'Non-veg', icon: '🍗' },
];
