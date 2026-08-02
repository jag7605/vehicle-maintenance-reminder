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
        return null;
    } else if (vehicleAge <= 13) {
        nextWoFDate.setFullYear(nextWoFDate.getFullYear() + 2);
    } else {
        nextWoFDate.setFullYear(nextWoFDate.getFullYear() + 1);
    }

    return nextWoFDate;

}

module.exports = { calculateNextWoFDate };