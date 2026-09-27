jest.mock("../firebase/adminConfig", () => ({
    db: {
      collection: jest.fn(),
    },
  }));
  
  jest.mock("../services/emailService", () => ({
    sendEmail: jest.fn(),
  }));
  
  jest.mock("../services/smsService", () => ({
    sendSMS: jest.fn(),
  }));
  
  jest.mock("../services/pushService", () => ({
    sendPush: jest.fn(),
  }));
  
  const { db } = require("../firebase/adminConfig");
  const { sendEmail } = require("../services/emailService");
  const { sendSMS } = require("../services/smsService");
  const { sendPush } = require("../services/pushService");
  const {
    sendReminder,
    sendBookingNotification,
    buildWofDueContent,
    buildOilChangeDueContent,
    buildCarReadyContent,
  } = require("../services/notificationService");
  
  // Fake Firestore Timestamp — only .toDate() is used by the source code.
  function fakeTimestamp(date) {
    return { toDate: () => date };
  }
  
  describe("content builders", () => {
    const vehicle = {
      year: 2018,
      make: "Toyota",
      model: "Corolla",
      rego: "ABC123",
    };
    const customer = { firstName: "Sam" };
  
    test("buildWofDueContent throws if vehicle has no nextWofDate", () => {
      expect(() => buildWofDueContent({ ...vehicle }, customer)).toThrow(
        "No WoF due date set for this vehicle. Please set a WoF date before sending a reminder."
      );
    });
  
    test("buildWofDueContent returns an upcoming-style message for a future date", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const v = { ...vehicle, nextWofDate: fakeTimestamp(futureDate) };
  
      const result = buildWofDueContent(v, customer);
  
      expect(result.subject).toBe("WoF Reminder");
      expect(result.message).toContain("is due for a WoF on");
      expect(result.message).not.toContain("overdue");
    });
  
    test("buildWofDueContent returns an overdue-style message for a past date", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const v = { ...vehicle, nextWofDate: fakeTimestamp(pastDate) };
  
      const result = buildWofDueContent(v, customer);
  
      expect(result.subject).toBe("WoF Overdue");
      expect(result.message).toContain("was due for a WoF on");
      expect(result.message).toContain("now overdue");
    });
  
    test("buildOilChangeDueContent throws if vehicle has no nextOilChangeDate", () => {
      expect(() => buildOilChangeDueContent({ ...vehicle }, customer)).toThrow(
        "No Oil Change due date set for this vehicle. Please set an Oil Change date before sending a reminder."
      );
    });
  
    test("buildOilChangeDueContent returns an overdue-style message for a past date", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const v = { ...vehicle, nextOilChangeDate: fakeTimestamp(pastDate) };
  
      const result = buildOilChangeDueContent(v, customer);
  
      expect(result.subject).toBe("Oil Change Overdue");
      expect(result.message).toContain("now overdue");
    });
  
    test("buildCarReadyContent returns a ready-for-pickup message", () => {
      const result = buildCarReadyContent(vehicle, customer);
  
      expect(result.subject).toBe("Your Vehicle Is Ready");
      expect(result.message).toContain("is ready for pickup!");
    });
  });
  
  describe("sendReminder", () => {
    const vehicle = { id: "v1", year: 2018, make: "Toyota", model: "Corolla", rego: "ABC123" };
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    vehicle.nextWofDate = fakeTimestamp(futureDate);
  
    let addMock;
  
    beforeEach(() => {
      jest.clearAllMocks();
      addMock = jest.fn().mockResolvedValue();
      db.collection.mockReturnValue({ add: addMock });
    });
  
    test("sends email when the customer has email preference enabled", async () => {
      const customer = {
        id: "c1",
        firstName: "Sam",
        email: "sam@example.com",
        notificationPreferences: { email: true },
      };
  
      const result = await sendReminder(vehicle, customer, "wofDue");
  
      expect(sendEmail).toHaveBeenCalledWith("sam@example.com", "WoF Reminder", expect.any(String));
      expect(result.email).toBe("sent");
    });
  
    test("does not send email when the customer has email preference disabled", async () => {
      const customer = {
        id: "c1",
        firstName: "Sam",
        email: "sam@example.com",
        notificationPreferences: { email: false },
      };
  
      const result = await sendReminder(vehicle, customer, "wofDue");
  
      expect(sendEmail).not.toHaveBeenCalled();
      expect(result.email).toBeUndefined();
    });
  
    test("marks email as failed if sendEmail throws", async () => {
      sendEmail.mockRejectedValueOnce(new Error("network error"));
      const customer = {
        id: "c1",
        firstName: "Sam",
        email: "sam@example.com",
        notificationPreferences: { email: true },
      };
  
      const result = await sendReminder(vehicle, customer, "wofDue");
  
      expect(result.email).toBe("failed");
    });
  
    test("sends push when browser preference is enabled and a subscription exists", async () => {
      const customer = {
        id: "c1",
        firstName: "Sam",
        notificationPreferences: { browser: true },
        pushSubscription: { endpoint: "https://push.example.com" },
      };
  
      const result = await sendReminder(vehicle, customer, "wofDue");
  
      expect(sendPush).toHaveBeenCalledWith(customer.pushSubscription, expect.any(String));
      expect(result.browser).toBe("sent");
    });
  
    test("marks push as failed when browser preference is enabled but no subscription is saved", async () => {
      const customer = {
        id: "c1",
        firstName: "Sam",
        notificationPreferences: { browser: true },
        pushSubscription: null,
      };
  
      const result = await sendReminder(vehicle, customer, "wofDue");
  
      expect(sendPush).not.toHaveBeenCalled();
      expect(result.browser).toBe("failed");
    });
  
    test("does not send SMS even if preference is enabled, since SMS is disabled in this deployment", async () => {
      const customer = {
        id: "c1",
        firstName: "Sam",
        phone: "0211234567",
        notificationPreferences: { sms: true },
      };
  
      const result = await sendReminder(vehicle, customer, "wofDue");
  
      expect(sendSMS).not.toHaveBeenCalled();
      expect(result.sms).toBeUndefined();
    });
  
    test("logs the notification to the database with the correct fields", async () => {
      const customer = {
        id: "c1",
        firstName: "Sam",
        email: "sam@example.com",
        notificationPreferences: { email: true },
      };
  
      await sendReminder(vehicle, customer, "wofDue");
  
      expect(db.collection).toHaveBeenCalledWith("notifications");
      expect(addMock).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: "c1",
          vehicleId: "v1",
          type: "wofDue",
          read: false,
          deliveryStatus: expect.any(Object),
        })
      );
    });
  
    test("throws for an unknown notification type", async () => {
      const customer = { id: "c1", firstName: "Sam", notificationPreferences: {} };
  
      await expect(sendReminder(vehicle, customer, "notARealType")).rejects.toThrow(
        'Unknown notification type: "notARealType".'
      );
    });
  });
  
  describe("sendBookingNotification", () => {
    const vehicle = { id: "v1", year: 2018, make: "Toyota", model: "Corolla", rego: "ABC123" };
    const appointment = {
      id: "a1",
      date: fakeTimestamp(new Date(2026, 5, 15, 14, 30)),
    };
  
    let addMock;
  
    beforeEach(() => {
      jest.clearAllMocks();
      addMock = jest.fn().mockResolvedValue();
      db.collection.mockReturnValue({ add: addMock });
    });
  
    test("builds a confirmed message and sends email", async () => {
      const customer = {
        id: "c1",
        firstName: "Sam",
        email: "sam@example.com",
        notificationPreferences: { email: true },
      };
  
      const result = await sendBookingNotification(appointment, vehicle, customer, "confirmed");
  
      expect(sendEmail).toHaveBeenCalledWith("sam@example.com", "Appointment Confirmed", expect.any(String));
      expect(result.email).toBe("sent");
    });
  
    test("builds a rejected message", async () => {
      const customer = {
        id: "c1",
        firstName: "Sam",
        email: "sam@example.com",
        notificationPreferences: { email: true },
      };
  
      await sendBookingNotification(appointment, vehicle, customer, "rejected");
  
      expect(sendEmail).toHaveBeenCalledWith("sam@example.com", "Appointment Rejected", expect.any(String));
    });
  
    test("builds a completed message with no next-due wording when nextDueDates is empty", async () => {
      const customer = {
        id: "c1",
        firstName: "Sam",
        email: "sam@example.com",
        notificationPreferences: { email: true },
      };
  
      await sendBookingNotification(appointment, vehicle, customer, "completed", []);
  
      expect(sendEmail).toHaveBeenCalledWith(
        "sam@example.com",
        "Service Completed",
        expect.not.stringContaining("is due by")
      );
    });
  
    test("builds a completed message including WoF and Oil Change due wording", async () => {
      const customer = {
        id: "c1",
        firstName: "Sam",
        email: "sam@example.com",
        notificationPreferences: { email: true },
      };
      const nextDueDates = [
        { serviceType: "WOF", date: fakeTimestamp(new Date(2027, 0, 1)) },
        { serviceType: "Oil Change", date: fakeTimestamp(new Date(2026, 11, 1)) },
      ];
  
      await sendBookingNotification(appointment, vehicle, customer, "completed", nextDueDates);
  
      const messageSent = sendEmail.mock.calls[0][2];
      expect(messageSent).toContain("Your next WoF is due by");
      expect(messageSent).toContain("Your next Oil Change is due by");
    });
  
    test("logs the notification to the database with appointmentId and status", async () => {
      const customer = {
        id: "c1",
        firstName: "Sam",
        email: "sam@example.com",
        notificationPreferences: { email: true },
      };
  
      await sendBookingNotification(appointment, vehicle, customer, "confirmed");
  
      expect(addMock).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: "a1",
          type: "booking",
          status: "confirmed",
        })
      );
    });
  
    test("throws for an unknown booking status", async () => {
      const customer = { id: "c1", firstName: "Sam", notificationPreferences: {} };
  
      await expect(
        sendBookingNotification(appointment, vehicle, customer, "notARealStatus")
      ).rejects.toThrow('Unknown booking status: "notARealStatus".');
    });
  });