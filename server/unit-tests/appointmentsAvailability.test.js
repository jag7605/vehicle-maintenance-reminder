jest.mock("../firebase/adminConfig", () => ({
    db: {
      collection: jest.fn(),
    },
  }));
  
  jest.mock("../services/notificationService", () => ({
    sendBookingNotification: jest.fn(),
  }));
  
  jest.mock("../services/jobCompletionService", () => ({
    runJobCompletion: jest.fn(),
  }));
  
  const express = require("express");
  const request = require("supertest");
  const { db } = require("../firebase/adminConfig");
  const appointmentsRouter = require("../routes/appointments");
  
  function buildApp() {
    const app = express();
    app.use(express.json());
    app.use("/api/admin", appointmentsRouter);
    return app;
  }
  
  function makeQuery(docs) {
    return {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs }),
    };
  }
  
  function makeApptDoc(date) {
    return { data: () => ({ date: { toDate: () => date } }) };
  }
  
  describe("GET /api/admin/appointments/availability", () => {
    let app;
  
    beforeEach(() => {
      jest.clearAllMocks();
      app = buildApp();
      db.collection.mockReturnValue(makeQuery([]));
    });
  
    afterEach(() => {
      jest.useRealTimers();
    });
  
    test("returns 400 when the date query param is missing", async () => {
      const res = await request(app).get("/api/admin/appointments/availability");
  
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/date.*required/i);
    });
  
    test("returns 400 when the date is not in YYYY-MM-DD format", async () => {
      const res = await request(app).get("/api/admin/appointments/availability?date=10-06-2026");
  
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/date.*required/i);
    });
  
    test("returns closed:true with no slots for a Sunday", async () => {
      // 2026-06-14 is a Sunday
      const res = await request(app).get("/api/admin/appointments/availability?date=2026-06-14");
  
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ date: "2026-06-14", closed: true, slots: [] });
    });
  
    test("returns 8 hourly slots, all available, for a weekday with no bookings", async () => {
      // 2026-06-10 is a Wednesday, far enough in the future to avoid "past" flags
      const res = await request(app).get("/api/admin/appointments/availability?date=2026-06-10");
  
      expect(res.status).toBe(200);
      expect(res.body.closed).toBe(false);
      expect(res.body.slots).toHaveLength(8); // 9am-5pm, 1hr slots
      expect(res.body.slots[0]).toEqual({ time: "09:00", available: true, reason: null });
      expect(res.body.slots.every((slot) => slot.available === true)).toBe(true);
    });
  
    test("marks a slot as booked when a blocking appointment exists at that hour", async () => {
      db.collection.mockReturnValue(makeQuery([makeApptDoc(new Date(2026, 5, 10, 11, 0))]));
  
      const res = await request(app).get("/api/admin/appointments/availability?date=2026-06-10");
  
      const bookedSlot = res.body.slots.find((s) => s.time === "11:00");
      expect(bookedSlot).toEqual({ time: "11:00", available: false, reason: "booked" });
    });
  
    test("marks a slot as past when the requested date is today and the slot's hour has already started", async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 5, 10, 13, 30)); // 1:30pm
  
      const res = await request(app).get("/api/admin/appointments/availability?date=2026-06-10");
  
      const pastSlot = res.body.slots.find((s) => s.time === "13:00");
      const futureSlot = res.body.slots.find((s) => s.time === "14:00");
      expect(pastSlot).toEqual({ time: "13:00", available: false, reason: "past" });
      expect(futureSlot).toEqual({ time: "14:00", available: true, reason: null });
    });
  
    test("returns 400 with the error message when the database query fails", async () => {
      db.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error("Firestore unavailable")),
      });
  
      const res = await request(app).get("/api/admin/appointments/availability?date=2026-06-10");
  
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Firestore unavailable");
    });
  });