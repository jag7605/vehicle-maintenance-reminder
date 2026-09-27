jest.mock("../firebase/adminConfig", () => ({
    db: {
      collection: jest.fn(),
    },
  }));
  
  jest.mock("../services/notificationService", () => ({
    sendReminder: jest.fn(),
  }));
  
  const express = require("express");
  const request = require("supertest");
  const { db } = require("../firebase/adminConfig");
  const { sendReminder } = require("../services/notificationService");
  const remindersRouter = require("../routes/reminders");
  
  function buildApp() {
    const app = express();
    app.use(express.json());
    app.use("/api/admin", remindersRouter);
    return app;
  }
  
  function makeDocRef({ exists, data }) {
    return {
      get: jest.fn().mockResolvedValue({
        exists,
        id: "doc1",
        data: () => data,
      }),
    };
  }
  
  describe("POST /api/admin/send-reminder/:vehicleId", () => {
    let app;
  
    beforeEach(() => {
      jest.clearAllMocks();
      app = buildApp();
    });
  
    test("returns 404 when the vehicle does not exist", async () => {
      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(makeDocRef({ exists: false })),
      });
  
      const res = await request(app).post("/api/admin/send-reminder/v1").send({});
  
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Vehicle not found.");
    });
  
    test("returns 404 when the customer does not exist", async () => {
      db.collection.mockImplementation((name) => {
        if (name === "vehicles") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: { ownerId: "c1" } })) };
        }
        if (name === "users") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: false })) };
        }
      });
  
      const res = await request(app).post("/api/admin/send-reminder/v1").send({});
  
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Customer not found.");
    });
  
    test("sends the reminder and returns deliveryStatus on success, defaulting type when omitted", async () => {
      db.collection.mockImplementation((name) => {
        if (name === "vehicles") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: { ownerId: "c1", make: "Toyota" } })) };
        }
        if (name === "users") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: { firstName: "Sam" } })) };
        }
      });
      sendReminder.mockResolvedValue({ email: "sent" });
  
      const res = await request(app).post("/api/admin/send-reminder/v1").send({});
  
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, deliveryStatus: { email: "sent" } });
      expect(sendReminder).toHaveBeenCalledWith(
        expect.objectContaining({ id: "doc1", ownerId: "c1", make: "Toyota" }),
        expect.objectContaining({ id: "doc1", firstName: "Sam" }),
        undefined
      );
    });
  
    test("passes the given type through to sendReminder", async () => {
      db.collection.mockImplementation((name) => {
        if (name === "vehicles") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: { ownerId: "c1" } })) };
        }
        if (name === "users") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: {} })) };
        }
      });
      sendReminder.mockResolvedValue({ email: "sent" });
  
      await request(app).post("/api/admin/send-reminder/v1").send({ type: "carReady" });
  
      expect(sendReminder).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), "carReady");
    });
  
    test("returns 400 with the error message when sendReminder throws", async () => {
      db.collection.mockImplementation((name) => {
        if (name === "vehicles") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: { ownerId: "c1" } })) };
        }
        if (name === "users") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: {} })) };
        }
      });
      sendReminder.mockRejectedValue(new Error("No WoF due date set for this vehicle."));
  
      const res = await request(app).post("/api/admin/send-reminder/v1").send({ type: "wofDue" });
  
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No WoF due date set for this vehicle.");
    });
  
    test("returns 400 with the error message when the database query fails", async () => {
      db.collection.mockImplementation(() => {
        throw new Error("Firestore unavailable");
      });
  
      const res = await request(app).post("/api/admin/send-reminder/v1").send({});
  
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Firestore unavailable");
    });
  });