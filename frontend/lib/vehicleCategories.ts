/** Must match `VEHICLE_CATEGORY_VALUES` in backend `vehicleCategories.js`. */
export const VEHICLE_CATEGORY_OPTIONS: { value: string; label: string }[] = [
    { value: "economy", label: "Economy / compact" },
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "hatchback", label: "Hatchback" },
    { value: "luxury", label: "Luxury" },
    { value: "electric", label: "Electric" },
    { value: "van", label: "Van" },
    { value: "mpv", label: "MPV" },
    { value: "sports", label: "Sports" },
    { value: "cruiser", label: "Cruiser (bike)" },
    { value: "commuter", label: "Commuter" },
    { value: "scooter", label: "Scooter" },
    { value: "adventure", label: "Adventure / off-road" },
    { value: "other", label: "Other" },
];

const ALL_CATEGORY_VALUES = VEHICLE_CATEGORY_OPTIONS.map((o) => o.value);

/** Category values allowed per vehicle `type` (car / bike / scooter / other). */
const CATEGORY_VALUES_BY_VEHICLE_TYPE: Record<string, readonly string[]> = {
    car: [
        "economy",
        "sedan",
        "suv",
        "hatchback",
        "luxury",
        "electric",
        "van",
        "mpv",
        "sports",
        "adventure",
        "other",
    ],
    bike: [
        "cruiser",
        "commuter",
        "sports",
        "adventure",
        "electric",
        "luxury",
        "economy",
        "other",
    ],
    scooter: ["scooter", "commuter", "electric", "luxury", "economy", "other"],
    other: ALL_CATEGORY_VALUES,
};

/** Dropdown options for category, filtered by selected vehicle type. */
export function getCategoryOptionsForVehicleType(vehicleType: string): { value: string; label: string }[] {
    if (!vehicleType) return [];
    const allowed = CATEGORY_VALUES_BY_VEHICLE_TYPE[vehicleType];
    if (!allowed) return [...VEHICLE_CATEGORY_OPTIONS];
    const set = new Set(allowed);
    return VEHICLE_CATEGORY_OPTIONS.filter((o) => set.has(o.value));
}

/**
 * Keeps category when it is valid for `vehicleType`, or clears it when incompatible.
 * If `vehicleType` is empty (e.g. "all types" in search), any category value is kept.
 */
export function sanitizeCategoryForVehicleType(category: string, vehicleType: string): string {
    const c = (category || "").trim();
    if (!c) return "";
    if (!vehicleType) return c;
    const allowed = new Set(getCategoryOptionsForVehicleType(vehicleType).map((o) => o.value));
    return allowed.has(c) ? c : "";
}

const labelByValue = Object.fromEntries(
    VEHICLE_CATEGORY_OPTIONS.map(({ value, label }) => [value, label])
);

export function formatVehicleCategory(category: string | undefined | null): string {
    if (!category) return labelByValue.other ?? "Other";
    return labelByValue[category] ?? category;
}
