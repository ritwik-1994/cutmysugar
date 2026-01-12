export const calculateGLRange = (gl: number): string => {
    // Determine percentage variation based on GL score
    let percentage = 0;

    if (gl < 10) {
        percentage = 0.05;
    } else if (gl < 15) {
        percentage = 0.0625;
    } else if (gl < 20) {
        percentage = 0.075;
    } else if (gl < 25) {
        percentage = 0.0875;
    } else if (gl < 30) {
        percentage = 0.10;
    } else if (gl < 35) {
        percentage = 0.125;
    } else if (gl < 40) {
        percentage = 0.15;
    } else if (gl < 45) {
        percentage = 0.175;
    } else if (gl < 50) {
        percentage = 0.20;
    } else if (gl < 55) {
        percentage = 0.2225;
    } else {
        percentage = 0.25;
    }

    const variation = gl * percentage;
    // Use floor/ceil to ensure we show a range even for small variations
    // e.g., 5 +/- 0.25 -> 4.75-5.25 -> "4-6" instead of "5"
    const min = Math.floor(gl - variation);
    const max = Math.ceil(gl + variation);

    // Only return single number if they are truly identical (e.g. gl=0)
    if (min === max) {
        return `${min}`;
    }

    // If min is negative, clamp to 0
    const safeMin = Math.max(0, min);

    return `${safeMin}-${max}`;
};
