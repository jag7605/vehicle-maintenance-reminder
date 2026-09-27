const { calculateNextWoFDate } = require("../utils/wofCalculator");

describe("calculateNextWoFDate", () => {
  test("returns Jan 1 of (vehicle.year + 4) when vehicle age is 3 or under", () => {
    const vehicle = { year: 2023 };
    const completedServiceDate = "2026-01-15";

    const result = calculateNextWoFDate(vehicle, completedServiceDate);

    expect(result).toEqual(new Date(2027, 0, 1));
  });

  test("returns Jan 1 of (vehicle.year + 4) at the exact age-3 boundary", () => {
    const vehicle = { year: 2023 };
    const completedServiceDate = "2026-06-01"; // age === 3

    const result = calculateNextWoFDate(vehicle, completedServiceDate);

    expect(result).toEqual(new Date(2027, 0, 1));
  });

  test("adds 2 years when vehicle age is between 4 and 13 inclusive", () => {
    const vehicle = { year: 2016 };
    const completedServiceDate = "2026-03-10"; // age === 10

    const result = calculateNextWoFDate(vehicle, completedServiceDate);

    expect(result).toEqual(new Date("2028-03-10T00:00:00.000Z"));
  });

  test("adds 2 years at the exact age-13 boundary", () => {
    const vehicle = { year: 2013 };
    const completedServiceDate = "2026-03-10"; // age === 13

    const result = calculateNextWoFDate(vehicle, completedServiceDate);

    expect(result).toEqual(new Date("2028-03-10T00:00:00.000Z"));
  });

  test("adds 1 year when vehicle age is over 13", () => {
    const vehicle = { year: 2010 };
    const completedServiceDate = "2026-03-10"; // age === 16

    const result = calculateNextWoFDate(vehicle, completedServiceDate);

    expect(result).toEqual(new Date("2027-03-10T00:00:00.000Z"));
  });

  test("adds 1 year at the exact age-14 boundary", () => {
    const vehicle = { year: 2012 };
    const completedServiceDate = "2026-03-10"; // age === 14

    const result = calculateNextWoFDate(vehicle, completedServiceDate);

    expect(result).toEqual(new Date("2027-03-10T00:00:00.000Z"));
  });

  test("throws an error when vehicle.year is missing", () => {
    const vehicle = {};
    const completedServiceDate = "2026-03-10";

    expect(() => calculateNextWoFDate(vehicle, completedServiceDate)).toThrow(
      "Invalid vehicle year or completed service date"
    );
  });

  test("throws an error when vehicle.year is 0", () => {
    const vehicle = { year: 0 };
    const completedServiceDate = "2026-03-10";

    expect(() => calculateNextWoFDate(vehicle, completedServiceDate)).toThrow(
      "Invalid vehicle year or completed service date"
    );
  });

  test("throws an error when completedServiceDate is invalid", () => {
    const vehicle = { year: 2016 };
    const completedServiceDate = "not-a-date";

    expect(() => calculateNextWoFDate(vehicle, completedServiceDate)).toThrow(
      "Invalid vehicle year or completed service date"
    );
  });
});