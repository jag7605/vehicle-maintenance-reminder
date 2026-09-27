jest.mock("../firebase/adminConfig", () => ({
    db: {
      collection: jest.fn(),
    },
  }));
  
  jest.mock("../services/notificationService", () => ({
    sendReminder: jest.fn(),
  }));
  
  const { db } = require("../firebase/adminConfig");
  const { sendReminder } = require("../services/notificationService");
  const { runScheduledReminders } = require("../jobs/scheduledReminders");
  
  // Builds a chainable Firestore-style query mock: .where().where().get()
  function makeVehicleQuery(docs) {
    return {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs }),
    };
  }
  
  function makeVehicleDoc(id, data) {
    return { id, data: () => data };
  }
  
  describe("runScheduledReminders", () => {
    let vehiclesQueryQueue;
    let usersById;
  
    beforeEach(() => {
      jest.clearAllMocks();
      vehiclesQueryQueue = [];
      usersById = {};
  
      db.collection.mockImplementation((name) => {
        if (name === "vehicles") {
          return vehiclesQueryQueue.shift();
        }
        if (name === "users") {
          return {
            doc: (id) => ({
              get: jest.fn().mockResolvedValue(
                usersById[id]
                  ? { exists: true, id, data: () => usersById[id] }
                  : { exists: false }
              ),
            }),
          };
        }
        throw new Error(`Unexpected collection name in test: ${name}`);
      });
    });
  
    test("sends a wofDue reminder for a vehicle found in the 7-day window, and an oilChangeDue reminder for a vehicle in the oil-change window", () => {
      usersById["owner1"] = { firstName: "Sam", lastName: "Lee" };
      usersById["owner2"] = { firstName: "Ana", lastName: "Ray" };
  
      // nextWofDate field: 7-day query returns one vehicle, 1-day query returns none
      vehiclesQueryQueue.push(makeVehicleQuery([makeVehicleDoc("v1", { ownerId: "owner1" })]));
      vehiclesQueryQueue.push(makeVehicleQuery([]));
  
      // nextOilChangeDate field: 7-day query returns none, 1-day query returns one vehicle
      vehiclesQueryQueue.push(makeVehicleQuery([]));
      vehiclesQueryQueue.push(makeVehicleQuery([makeVehicleDoc("v2", { ownerId: "owner2" })]));
  
      return runScheduledReminders().then(() => {
        expect(sendReminder).toHaveBeenCalledTimes(2);
        expect(sendReminder).toHaveBeenCalledWith(
          expect.objectContaining({ id: "v1", ownerId: "owner1" }),
          expect.objectContaining({ id: "owner1", firstName: "Sam" }),
          "wofDue"
        );
        expect(sendReminder).toHaveBeenCalledWith(
          expect.objectContaining({ id: "v2", ownerId: "owner2" }),
          expect.objectContaining({ id: "owner2", firstName: "Ana" }),
          "oilChangeDue"
        );
      });
    });
  
    test("skips a vehicle when its owner customer document does not exist, without throwing", () => {
      // owner3 is intentionally missing from usersById
  
      vehiclesQueryQueue.push(makeVehicleQuery([makeVehicleDoc("v3", { ownerId: "owner3" })]));
      vehiclesQueryQueue.push(makeVehicleQuery([]));
      vehiclesQueryQueue.push(makeVehicleQuery([]));
      vehiclesQueryQueue.push(makeVehicleQuery([]));
  
      return expect(runScheduledReminders()).resolves.toBeUndefined().then(() => {
        expect(sendReminder).not.toHaveBeenCalled();
      });
    });
  
    test("continues processing remaining vehicles when sendReminder throws for one of them", () => {
      usersById["owner4"] = { firstName: "Kim", lastName: "Wu" };
      usersById["owner5"] = { firstName: "Leo", lastName: "Fox" };
  
      vehiclesQueryQueue.push(
        makeVehicleQuery([
          makeVehicleDoc("v4", { ownerId: "owner4" }),
          makeVehicleDoc("v5", { ownerId: "owner5" }),
        ])
      );
      vehiclesQueryQueue.push(makeVehicleQuery([]));
      vehiclesQueryQueue.push(makeVehicleQuery([]));
      vehiclesQueryQueue.push(makeVehicleQuery([]));
  
      sendReminder.mockRejectedValueOnce(new Error("email service down")).mockResolvedValueOnce();
  
      return expect(runScheduledReminders()).resolves.toBeUndefined().then(() => {
        expect(sendReminder).toHaveBeenCalledTimes(2);
      });
    });
  
    test("queries the vehicles collection using the correct field name for each reminder type", () => {
      vehiclesQueryQueue.push(makeVehicleQuery([]));
      vehiclesQueryQueue.push(makeVehicleQuery([]));
      vehiclesQueryQueue.push(makeVehicleQuery([]));
      vehiclesQueryQueue.push(makeVehicleQuery([]));
  
      // Capture query mocks before they're shifted out of the queue
      const [wofSevenDay, wofOneDay, oilSevenDay, oilOneDay] = vehiclesQueryQueue;
  
      return runScheduledReminders().then(() => {
        expect(wofSevenDay.where).toHaveBeenCalledWith("nextWofDate", ">=", expect.anything());
        expect(wofOneDay.where).toHaveBeenCalledWith("nextWofDate", ">=", expect.anything());
        expect(oilSevenDay.where).toHaveBeenCalledWith("nextOilChangeDate", ">=", expect.anything());
        expect(oilOneDay.where).toHaveBeenCalledWith("nextOilChangeDate", ">=", expect.anything());
      });
    });
  });