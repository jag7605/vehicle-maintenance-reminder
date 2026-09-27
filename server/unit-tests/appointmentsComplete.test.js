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
  const { runJobCompletion } = require("../services/jobCompletionService");
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
  
  describe("PATCH /api/admin/appointments/:appointmentId/complete", () => {
    let app;
    let appointmentUpdateMock;
  
    beforeEach(() => {
      jest.clearAllMocks();
      app = buildApp();
      appointmentUpdateMock = jest.fn().mockResolvedValue();
    });
  
    afterEach(() => {
      jest.useRealTimers();
    });
  
    test("returns 400 when postServiceNotes is provided but is not a string", async () => {
      const res = await request(app)
        .patch("/api/admin/appointments/a1/complete")
        .send({ postServiceNotes: 12345 });
  
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("postServiceNotes must be a string.");
    });
  
    test("returns 404 when the appointment does not exist", async () => {
      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(makeDocRef({ exists: false })),
      });
  
      const res = await request(app).patch("/api/admin/appointments/a1/complete").send({});
  
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Appointment not found.");
    });
  
    test("returns 400 when the appointment status is not 'confirmed'", async () => {
      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(
          makeDocRef({
            exists: true,
            data: { status: "pending", date: { toDate: () => new Date(2026, 0, 1) } },
          })
        ),
      });
  
      const res = await request(app).patch("/api/admin/appointments/a1/complete").send({});
  
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Cannot complete an appointment with status "pending"/);
    });
  
    test("returns 400 when the appointment's date is invalid", async () => {
      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(
          makeDocRef({
            exists: true,
            data: { status: "confirmed", date: { toDate: () => new Date("not-a-date") } },
          })
        ),
      });
  
      const res = await request(app).patch("/api/admin/appointments/a1/complete").send({});
  
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Appointment has an invalid date.");
    });
  
    test("returns 400 when the appointment's scheduled time has not passed yet", async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 5, 1, 9, 0));
  
      db.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(
          makeDocRef({
            exists: true,
            data: {
              status: "confirmed",
              date: { toDate: () => new Date(2026, 5, 1, 14, 0) }, // later today
            },
          })
        ),
      });
  
      const res = await request(app).patch("/api/admin/appointments/a1/complete").send({});
  
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/scheduled time has not passed yet/);
    });
  
    test("returns 404 when the vehicle does not exist", async () => {
      db.collection.mockImplementation((name) => {
        if (name === "appointments") {
          return {
            doc: jest.fn().mockReturnValue(
              makeDocRef({
                exists: true,
                data: {
                  status: "confirmed",
                  date: { toDate: () => new Date(2020, 0, 1) },
                  vehicleId: "v1",
                  customerId: "c1",
                },
                updateMock: appointmentUpdateMock,
              })
            ),
          };
        }
        if (name === "vehicles") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: false })) };
        }
      });
  
      const res = await request(app).patch("/api/admin/appointments/a1/complete").send({});
  
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
                data: {
                  status: "confirmed",
                  date: { toDate: () => new Date(2020, 0, 1) },
                  vehicleId: "v1",
                  customerId: "c1",
                },
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
  
      const res = await request(app).patch("/api/admin/appointments/a1/complete").send({});
  
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Customer not found.");
    });
  
    test("completes the appointment, runs job completion, and returns success on a valid request", async () => {
      db.collection.mockImplementation((name) => {
        if (name === "appointments") {
          return {
            doc: jest.fn().mockReturnValue(
              makeDocRef({
                exists: true,
                data: {
                  status: "confirmed",
                  date: { toDate: () => new Date(2020, 0, 1) },
                  vehicleId: "v1",
                  customerId: "c1",
                },
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
      runJobCompletion.mockResolvedValue({ deliveryStatus: { email: "sent" } });
  
      const res = await request(app)
        .patch("/api/admin/appointments/a1/complete")
        .send({ postServiceNotes: "Used synthetic oil" });
  
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deliveryStatus).toEqual({ email: "sent" });
      expect(res.body.appointment.status).toBe("completed");
      expect(res.body.appointment.postServiceNotes).toBe("Used synthetic oil");
      expect(appointmentUpdateMock).toHaveBeenCalledWith({
        status: "completed",
        postServiceNotes: "Used synthetic oil",
      });
      expect(runJobCompletion).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed", postServiceNotes: "Used synthetic oil" }),
        expect.objectContaining({ make: "Toyota" }),
        expect.objectContaining({ firstName: "Sam" }),
        expect.any(Date)
      );
    });
  
    test("defaults postServiceNotes to an empty string when omitted", async () => {
      db.collection.mockImplementation((name) => {
        if (name === "appointments") {
          return {
            doc: jest.fn().mockReturnValue(
              makeDocRef({
                exists: true,
                data: {
                  status: "confirmed",
                  date: { toDate: () => new Date(2020, 0, 1) },
                  vehicleId: "v1",
                  customerId: "c1",
                },
                updateMock: appointmentUpdateMock,
              })
            ),
          };
        }
        if (name === "vehicles") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: {} })) };
        }
        if (name === "users") {
          return { doc: jest.fn().mockReturnValue(makeDocRef({ exists: true, data: {} })) };
        }
      });
      runJobCompletion.mockResolvedValue({ deliveryStatus: {} });
  
      const res = await request(app).patch("/api/admin/appointments/a1/complete").send({});
  
      expect(appointmentUpdateMock).toHaveBeenCalledWith({
        status: "completed",
        postServiceNotes: "",
      });
    });
  
    test("returns 400 with the error message when an unexpected error occurs", async () => {
      db.collection.mockImplementation(() => {
        throw new Error("Firestore unavailable");
      });
  
      const res = await request(app).patch("/api/admin/appointments/a1/complete").send({});
  
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Firestore unavailable");
    });
  });