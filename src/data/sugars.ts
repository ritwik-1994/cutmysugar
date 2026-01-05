export interface SugarType {
    id: string;
    name: string;
    gi: number;
    category: 'High' | 'Moderate' | 'Zero';
    description?: string;
}

export const SUGAR_TYPES: SugarType[] = [
    { id: 'white_sugar', name: 'White Sugar', gi: 65, category: 'High' },
    { id: 'brown_sugar', name: 'Brown Sugar', gi: 65, category: 'High' },
    { id: 'jaggery', name: 'Jaggery (Gur)', gi: 80, category: 'High', description: 'Not diabetic-safe' },
    { id: 'honey', name: 'Honey', gi: 58, category: 'Moderate' },
    { id: 'coconut_sugar', name: 'Coconut Sugar', gi: 38, category: 'Moderate' },
    { id: 'date_syrup', name: 'Date Syrup', gi: 62, category: 'Moderate' },
    { id: 'stevia', name: 'Stevia / Zero Cal', gi: 0, category: 'Zero' },
];

export const SUGAR_UNIT_WEIGHTS = {
    spoon: 5, // 1 teaspoon ~ 5g
    tbsp: 15, // 1 tablespoon ~ 15g
};
