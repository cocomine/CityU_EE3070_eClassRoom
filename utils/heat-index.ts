// Utility helpers for computing Heat Index (NWS / Rothfusz regression).

// Keep a value within a fixed range.
const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
};

// Convert between temperature units.
export const toFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32;
export const toCelsius = (fahrenheit: number) => ((fahrenheit - 32) * 5) / 9;

// NWS heat index (Rothfusz regression). Input: Fahrenheit and relative humidity percent.
export const heatIndexF = (tempF: number, rh: number) => {
    const relativeHumidity = clamp(rh, 0, 100);

    // Use the simplified formula for lower heat index values.
    const simple =
        0.5 * (tempF + 61.0 + (tempF - 68.0) * 1.2 + relativeHumidity * 0.094);
    const simpleAvg = (simple + tempF) / 2;

    if ( simpleAvg < 80 ) {
        return simpleAvg;
    }

    // Rothfusz regression for higher heat index values.
    let hi =
        -42.379 +
        2.04901523 * tempF +
        10.14333127 * relativeHumidity -
        0.22475541 * tempF * relativeHumidity -
        0.00683783 * tempF * tempF -
        0.05481717 * relativeHumidity * relativeHumidity +
        0.00122874 * tempF * tempF * relativeHumidity +
        0.00085282 * tempF * relativeHumidity * relativeHumidity -
        0.00000199 * tempF * tempF * relativeHumidity * relativeHumidity;

    // Optional NWS adjustments for low/high humidity bands.
    if ( relativeHumidity < 13 && tempF >= 80 && tempF <= 112 ) {
        hi -=
            ((13 - relativeHumidity) / 4) *
            Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
    } else if ( relativeHumidity > 85 && tempF >= 80 && tempF <= 87 ) {
        hi += ((relativeHumidity - 85) / 10) * ((87 - tempF) / 5);
    }

    return hi;
};

// Convenience wrapper that accepts Celsius + RH and returns Celsius.
export const heatIndexC = (tempC: number, rh: number) => {
    const hiF = heatIndexF(toFahrenheit(tempC), rh);
    return toCelsius(hiF);
};
