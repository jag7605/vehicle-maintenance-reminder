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
  const { sendBookingNotification } = require("../services/notificationService");
  const appointmentsRouter = require("../routes/appointments");
  
  function buildApp() {
    const app = express();
    app.use(express.json());
    app.use("/api/admin", appointmentsRouter);
    return app;
  }
  
  function makeDocRef({ exists, data, updateMock }) {
    return {
      get: jest.fn().mockResolvedValue({
        exists,
        id: "doc1",
        data: () => data,
      }),
      update: updateMock || jest.fn().mockResolvedValue(),
    };
  }
  
  describe("PATCH /api/admin/appointments/:appointmentId/status", () => {
    let app;
    let appointmentUpdateMock;
  
    beforeEach(() => {
      jest.clearAllMocks();
      app = buildApp();
      appointmentUpdateMock = jest.fn().mockResolvedValue();
    });
  
    test("returns 400 for an invalid status value", async () => {
      const res = await request(app)
        .patch("/api/admin/appointments/a1/status")
        .send({ status: "notARealStatus" });
  
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status/);
    });
  
    test("returns 404 when the appointment does not exist", async () => {
      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(makeDocRef({ exists: false })),
      });
  
      const res = await request(app)
        .patch("/api/admin/appointments/a1/status")
        .send({ status: "confirmed" });
  
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Appointment not found.");
    });
  
    test("returns 404 when the vehicle does not exist", async () => {
      db.collection.mockImplementation((name) => {
        if (name === "appointments") {
          return {
            doc: jest.fn().mockReturnValue(
              makeDocRef({
                exists: true,
                data: { vehicleId: "v1", customerId: "c1", date: {} },
                updateMock: appointmentUpdateMock,
              })
            ),
          };
        }
        if (name === "vehicles") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: false })) };
        }
      });
  
      const res = await request(app)
        .patch("/api/admin/appointments/a1/status")
        .send({ status: "confirmed" });
  
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Vehicle not found.");
    });
  
    test("returns 404 when the customer does not exist", async () => {
      db.collection.mockImplementation((name) => {
        if (name === "appointments") {
          return {
            doc: jest.fn().mockReturnValue(
              makeDocRef({
                exists: true,
                data: { vehicleId: "v1", customerId: "c1", date: {} },
                updateMock: appointmentUpdateMock,
              })
            ),
          };
        }
        if (name === "vehicles") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: {} })) };
        }
        if (name === "users") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: false })) };
        }
      });
  
      const res = await request(app)
        .patch("/api/admin/appointments/a1/status")
        .send({ status: "confirmed" });
  
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Customer not found.");
    });
  
    test("updates the appointment status, sends the notification, and returns deliveryStatus on success", async () => {
      db.collection.mockImplementation((name) => {
        if (name === "appointments") {
          return {
            doc: jest.fn().mockReturnValue(
              makeDocRef({
                exists: true,
                data: { vehicleId: "v1", customerId: "c1", date: {} },
                updateMock: appointmentUpdateMock,
              })
            ),
          };
        }
        if (name === "vehicles") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: { make: "Toyota" } })) };
        }
        if (name === "users") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: { firstName: "Sam" } })) };
        }
      });
      sendBookingNotification.mockResolvedValue({ email: "sent" });
  
      const res = await request(app)
        .patch("/api/admin/appointments/a1/status")
        .send({ status: "confirmed" });
  
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, deliveryStatus: { email: "sent" } });
      expect(appointmentUpdateMock).toHaveBeenCalledWith({ status: "confirmed" });
      expect(sendBookingNotification).toHaveBeenCalledWith(
        expect.objectContaining({ id: "doc1", vehicleId: "v1", customerId: "c1" }),
        expect.objectContaining({ id: "doc1", make: "Toyota" }),
        expect.objectContaining({ id: "doc1", firstName: "Sam" }),
        "confirmed"
      );
    });
  
    test("returns 400 with the error message when an unexpected error occurs", async () => {
      db.collection.mockImplementation(() => {
        throw new Error("Firestore unavailable");
      });
  
      const res = await request(app)
        .patch("/api/admin/appointments/a1/status")
        .send({ status: "confirmed" });
  
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Firestore unavailable");
    });
  });