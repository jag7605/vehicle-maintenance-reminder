jest.mock("../firebase/adminConfig", () => ({
    db: {
      collection: jest.fn(),
    },
  }));
  
  jest.mock("../utils/wofCalculator", () => ({
    calculateNextWoFDate: jest.fn(),
  }));
  
  jest.mock("../utils/oilChangeCalculator", () => ({
    calculateNextOilChangeDate: jest.fn(),
  }));
  
  jest.mock("../services/notificationService", () => ({
    sendBookingNotification: jest.fn(),
  }));
  
  const { db } = require("../firebase/adminConfig");
  const { calculateNextWoFDate } = require("../utils/wofCalculator");
  const { calculateNextOilChangeDate } = require("../utils/oilChangeCalculator");
  const { sendBookingNotification } = require("../services/notificationService");
  const { runJobCompletion } = require("../services/jobCompletionService");
  const { Timestamp } = require("firebase-admin/firestore");
  
  describe("runJobCompletion", () => {
    const vehicle = { id: "v1", year: 2018 };
    const customer = { id: "c1", firstName: "Sam" };
    const completedServiceDate = new Date(2026, 5, 1);
  
    let updateMock;
  
    beforeEach(() => {
      jest.clearAllMocks();
      updateMock = jest.fn().mockResolvedValue();
      db.collection.mockReturnValue({ doc: jest.fn().mockReturnValue({ update: updateMock }) });
      sendBookingNotification.mockResolvedValue({ email: "sent" });
    });
  
    test("calculates and writes nextWofDate for a WOF service type", async () => {
      const wofDate = new Date(2028, 5, 1);
      calculateNextWoFDate.mockReturnValue(wofDate);
      const appointment = { id: "a1", serviceType: "WOF" };
  
      const result = await runJobCompletion(appointment, vehicle, customer, completedServiceDate);
  
      expect(calculateNextWoFDate).toHaveBeenCalledWith(vehicle, completedServiceDate);
      expect(db.collection).toHaveBeenCalledWith("vehicles");
      expect(updateMock).toHaveBeenCalledWith({ nextWofDate: Timestamp.fromDate(wofDate) });
      expect(result.vehicleUpdates).toEqual({ nextWofDate: Timestamp.fromDate(wofDate) });
    });
  
    test("calculates and writes nextOilChangeDate for an Oil Change service type", async () => {
      const oilTimestamp = Timestamp.fromDate(new Date(2026, 11, 1));
      calculateNextOilChangeDate.mockReturnValue(oilTimestamp);
      const appointment = { id: "a1", serviceType: "Oil Change" };
  
      const result = await runJobCompletion(appointment, vehicle, customer, completedServiceDate);
  
      expect(calculateNextOilChangeDate).toHaveBeenCalledWith(completedServiceDate);
      expect(updateMock).toHaveBeenCalledWith({ nextOilChangeDate: oilTimestamp });
      expect(result.vehicleUpdates).toEqual({ nextOilChangeDate: oilTimestamp });
    });
  
    test("handles a multi-service appointment (primary + additionalServiceTypes)", async () => {
      const wofDate = new Date(2028, 5, 1);
      const oilTimestamp = Timestamp.fromDate(new Date(2026, 11, 1));
      calculateNextWoFDate.mockReturnValue(wofDate);
      calculateNextOilChangeDate.mockReturnValue(oilTimestamp);
      const appointment = {
        id: "a1",
        serviceType: "WOF",
        additionalServiceTypes: ["Oil Change"],
      };
  
      const result = await runJobCompletion(appointment, vehicle, customer, completedServiceDate);
  
      expect(result.vehicleUpdates).toEqual({
        nextWofDate: Timestamp.fromDate(wofDate),
        nextOilChangeDate: oilTimestamp,
      });
      expect(updateMock).toHaveBeenCalledTimes(1);
    });
  
    test("does not write to the vehicle document for service types with no lead time (e.g. General Service)", async () => {
      const appointment = { id: "a1", serviceType: "General Service" };
  
      const result = await runJobCompletion(appointment, vehicle, customer, completedServiceDate);
  
      expect(calculateNextWoFDate).not.toHaveBeenCalled();
      expect(calculateNextOilChangeDate).not.toHaveBeenCalled();
      expect(db.collection).not.toHaveBeenCalledWith("vehicles");
      expect(updateMock).not.toHaveBeenCalled();
      expect(result.vehicleUpdates).toEqual({});
    });
  
    test("passes the correct nextDueDates array into sendBookingNotification", async () => {
      const wofDate = new Date(2028, 5, 1);
      calculateNextWoFDate.mockReturnValue(wofDate);
      const appointment = { id: "a1", serviceType: "WOF" };
  
      await runJobCompletion(appointment, vehicle, customer, completedServiceDate);
  
      expect(sendBookingNotification).toHaveBeenCalledWith(
        appointment,
        vehicle,
        customer,
        "completed",
        [{ serviceType: "WOF", date: wofDate }]
      );
    });
  
    test("passes an empty nextDueDates array when no service type carries a lead time", async () => {
      const appointment = { id: "a1", serviceType: "Brake Check" };
  
      await runJobCompletion(appointment, vehicle, customer, completedServiceDate);
  
      expect(sendBookingNotification).toHaveBeenCalledWith(
        appointment,
        vehicle,
        customer,
        "completed",
        []
      );
    });
  
    test("returns the deliveryStatus from sendBookingNotification", async () => {
      sendBookingNotification.mockResolvedValue({ email: "sent", browser: "failed" });
      const appointment = { id: "a1", serviceType: "General Service" };
  
      const result = await runJobCompletion(appointment, vehicle, customer, completedServiceDate);
  
      expect(result.deliveryStatus).toEqual({ email: "sent", browser: "failed" });
    });
  });