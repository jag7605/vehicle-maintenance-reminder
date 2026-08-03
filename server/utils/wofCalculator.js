function calculateNextWoFDate(vehicle, completedServiceDate) {
    const vehicleYear = Number(vehicle.year);
    const completedDate = new Date(completedServiceDate);
    const currentYear = completedDate.getFullYear();
    const vehicleAge = currentYear - vehicleYear;
    const nextWoFDate = new Date(completedDate);

    if (!vehicleYear || Number.isNaN(completedDate.getTime())) {
        throw new Error('Invalid vehicle year or completed service date');
    }

    if (vehicleAge <= 3) {
        // Vehicle isn't yet old enough to need a WoF. Rather than leaving
        // no due date at all, calculate its first-due date assuming
        // registration on Jan 1 of vehicle.year (an approximation, since
        // only the year is stored, not an exact registration date) — the
        // vehicle becomes eligible on Jan 1 of vehicle.year + 4.
        return new Date(vehicleYear + 4, 0, 1);
    } else if (vehicleAge <= 13) {
        nextWoFDate.setFullYear(nextWoFDate.getFullYear() + 2);
    } else {
        nextWoFDate.setFullYear(nextWoFDate.getFullYear() + 1);
    }

    return nextWoFDate;

}

module.exports = { calculateNextWoFDate };