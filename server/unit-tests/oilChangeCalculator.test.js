const { calculateNextOilChangeDate } = require("../utils/oilChangeCalculator");
const { Timestamp } = require("firebase-admin/firestore");

describe("calculateNextOilChangeDate", () => {
  test("returns a Timestamp 6 months after the completion date", () => {
    const completionDate = new Date(2026, 2, 10); // 10 March 2026

    const result = calculateNextOilChangeDate(completionDate);

    expect(result).toEqual(Timestamp.fromDate(new Date(2026, 8, 10))); // 10 Sept 2026
  });

  test("correctly rolls over into the next year", () => {
    const completionDate = new Date(2026, 9, 15); // 15 October 2026

    const result = calculateNextOilChangeDate(completionDate);

    expect(result).toEqual(Timestamp.fromDate(new Date(2027, 3, 15))); // 15 April 2027
  });

  test("handles end-of-month dates where the target month is shorter", () => {
    // 31 Jan + 6 months would land on 31 July, which exists, so use
    // 31 August instead to actually exercise JS's month-overflow behaviour
    // (31 Aug + 6 months = 31 Feb, which doesn't exist -> rolls into March)
    const completionDate = new Date(2026, 7, 31); // 31 August 2026

    const result = calculateNextOilChangeDate(completionDate);

    // JS Date rolls Feb 31 -> March 3 (2027 is not a leap year)
    expect(result).toEqual(Timestamp.fromDate(new Date(2027, 2, 3)));
  });

  test("returns a Timestamp instance, not a raw Date", () => {
    const completionDate = new Date(2026, 0, 1);

    const result = calculateNextOilChangeDate(completionDate);

    expect(result).toBeInstanceOf(Timestamp);
  });

  test("throws an error when input is not a Date instance", () => {
    expect(() => calculateNextOilChangeDate("2026-03-10")).toThrow(
      "calculateNextOilChangeDate requires a valid JS Date as input."
    );
  });

  test("throws an error when input is an invalid Date", () => {
    const invalidDate = new Date("not-a-real-date");

    expect(() => calculateNextOilChangeDate(invalidDate)).toThrow(
      "calculateNextOilChangeDate requires a valid JS Date as input."
    );
  });

  test("throws an error when input is null", () => {
    expect(() => calculateNextOilChangeDate(null)).toThrow(
      "calculateNextOilChangeDate requires a valid JS Date as input."
    );
  });
});