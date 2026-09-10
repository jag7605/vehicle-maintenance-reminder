// server/scripts/seedMockData.js
// Usage: node scripts/seedMockData.js --dry-run   (preview counts, no writes)
//        node scripts/seedMockData.js              (actually create data)
//
// Creates ~20 mock customers (Firestore users docs only — no Firebase Auth
// accounts, so nobody can log in as them), 1-3 vehicles each, a handful of
// notifications using the app's real message templates, and a small set of
// past/future appointments. Every document gets isMockData: true so
// clearMockData.js can remove exactly this data and nothing else.
//
// All dates are computed relative to when this script is run, so re-running
// it later still produces sensible "overdue / due soon / future" spreads.
//
// NUM_CUSTOMERS is the single dial for scaling the whole dataset — vehicles,
// notifications, and appointments are all derived from the customer list, and
// OVERDUE_TARGET/DUE_SOON_TARGET scale proportionally with it.

require("dotenv").config();
const { db } = require("../firebase/adminConfig");
const { Timestamp } = require("firebase-admin/firestore");
const {
  buildWofDueContent,
  buildOilChangeDueContent,
  buildCarReadyContent,
} = require("../services/notificationService");
const {
  OPEN_HOUR,
  CLOSE_HOUR,
  CLOSED_DAYS_OF_WEEK,
} = require("../config/workingHours");

const isDryRun = process.argv.includes("--dry-run");

const NUM_CUSTOMERS = 50;
const MIN_VEHICLES = 1;
const MAX_VEHICLES = 3;
// Both scale with NUM_CUSTOMERS so the overdue/due-soon ratio stays consistent even if you change the customer count. 

const OVERDUE_TARGET = Math.round((NUM_CUSTOMERS / 20) * 3); // For every 20 customers, __ vehicles will be overdue (the blank is the number after the asterisk)
const DUE_SOON_TARGET = Math.round((NUM_CUSTOMERS / 20) * 6); // refer to the above comment for explanation, same logic applies
const DUE_SOON_WINDOW_DAYS = 30;

// Mirrors client's SlotBookingForm.jsx SERVICE_TYPES — keep in sync if that changes.
const SERVICE_TYPES = ["WOF", "Oil Change", "General Service", "Brake Check", "Tyre Check"];

const FIRST_NAMES = [
    "Liam", "Emma", "Noah", "Olivia", "Jack", "Ava", "Lucas", "Mia", "Ethan", "Grace",
    "Oliver", "Chloe", "James", "Ruby", "Henry", "Zoe", "Leo", "Isla", "Max", "Ella",
    "William", "Sophia", "Benjamin", "Charlotte", "Lucas", "Amelia", "Mason", "Harper", "Elijah", "Evelyn",
    "Alexander", "Abigail", "Daniel", "Emily", "Michael", "Elizabeth", "James", "Sofia", "Benjamin", "Avery",
    "Logan", "Ella", "David", "Madison", "Sebastian", "Scarlett", "Jackson", "Victoria", "Aria", "Grace"
  ];
  
  const LAST_NAMES = [
    "Smith", "Wilson", "Brown", "Taylor", "Anderson", "Thomas", "Roberts", "Walker",
    "White", "Clark", "Lewis", "Young", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Carter",
    "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins",
    "Stewart", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey", "Rivera",
    "Cooper", "Richardson", "Cox", "Howard", "Ward", "Torres", "Peterson", "Gray", "Ramirez", "James"
  ];
  

// Small representative subset — duplicated here rather than importing the
// client's vehicleMakesModels.js, since that file uses ESM export syntax
// and this script runs as CommonJS.
const MOCK_VEHICLES = [
    { make: "Toyota", models: ["Corolla", "Camry", "RAV4", "Hilux", "Yaris", "Highlander", "Land Cruiser"] },
    { make: "Honda", models: ["Civic", "CR-V", "Jazz", "Accord", "HR-V", "Odyssey"] },
    { make: "Mazda", models: ["Mazda3", "CX-5", "Mazda2", "CX-30", "CX-9", "MX-5 Miata"] },
    { make: "Ford", models: ["Ranger", "Focus", "Escape", "Mustang", "Everest", "Explorer"] },
    { make: "Nissan", models: ["X-Trail", "Navara", "Qashqai", "Patrol", "Juke", "Pathfinder"] },
    { make: "Holden", models: ["Commodore", "Astra", "Colorado", "Captiva"] },
    { make: "Volkswagen", models: ["Golf", "Tiguan", "Polo", "Passat", "Amarok", "Touareg"] },
    { make: "Subaru", models: ["Outback", "Forester", "Impreza", "XV Crosstrek", "WRX"] },
    { make: "Hyundai", models: ["Tucson", "Santa Fe", "i30", "Kona", "Elantra", "Palisade"] },
    { make: "Kia", models: ["Sportage", "Seltos", "Sorento", "Cerato", "Rio", "Stinger"] },
    { make: "Mitsubishi", models: ["Triton", "Outlander", "ASX", "Eclipse Cross", "Pajero Sport"] },
    { make: "Suzuki", models: ["Swift", "Jimny", "Vitara", "Ignis"] },
    { make: "BMW", models: ["3 Series", "X5", "5 Series", "X3", "M4"] },
    { make: "Mercedes-Benz", models: ["C-Class", "E-Class", "GLC", "A-Class", "GLE"] },
    { make: "Audi", models: ["A4", "Q5", "A3", "Q7", "A6"] }
  ];
  

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomRego(usedRegos) {
  let rego;
  do {
    const letters = Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + randomInt(0, 25))
    ).join("");
    const digits = String(randomInt(0, 999)).padStart(3, "0");
    rego = `${letters}${digits}`;
  } while (usedRegos.has(rego));
  usedRegos.add(rego);
  return rego;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Picks dates for nextWofDate/nextOilChangeDate based on a target status —
// this directly assigns the target date rather than deriving it from the
// age-band calculators, since here we're choosing the *current state* of
// the vehicle, not simulating a just-completed service.
function buildVehicleDates(status) {
  const now = new Date();
  const primaryField = Math.random() < 0.5 ? "wof" : "oil";

  function farFutureDate() {
    return addDays(now, randomInt(90, 365));
  }

  let primaryDate;
  if (status === "overdue") {
    primaryDate = addDays(now, -randomInt(1, 30)); // within the last month, per the "no stale mock data" rule
  } else if (status === "dueSoon") {
    primaryDate = addDays(now, randomInt(1, DUE_SOON_WINDOW_DAYS));
  } else {
    primaryDate = farFutureDate();
  }

  const secondaryDate = status === "future" ? farFutureDate() : farFutureDate();

  return primaryField === "wof"
    ? { nextWofDate: primaryDate, nextOilChangeDate: secondaryDate }
    : { nextWofDate: secondaryDate, nextOilChangeDate: primaryDate };
}

// Tracks booked slots as we generate appointments so two mock appointments
// never collide with each other. Real bookings can't collide with these
// since the vehicles themselves are brand new, created by this script.
function pickWorkingSlot(minDaysAhead, maxDaysAhead, bookedSlots, direction = "future") {
  for (let attempt = 0; attempt < 100; attempt++) {
    const dayOffset = randomInt(minDaysAhead, maxDaysAhead);
    const date = direction === "future" ? addDays(new Date(), dayOffset) : addDays(new Date(), -dayOffset);

    if (CLOSED_DAYS_OF_WEEK.includes(date.getDay())) continue;

    const hour = randomInt(OPEN_HOUR, CLOSE_HOUR - 1);
    date.setHours(hour, 0, 0, 0);

    const key = `${date.toISOString().slice(0, 10)}_${hour}`;
    if (bookedSlots.has(key)) continue;

    bookedSlots.add(key);
    return date;
  }
  return null; // couldn't find a free slot after 100 tries — caller should skip
}

async function commitInChunks(writes) {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < writes.length; i += CHUNK_SIZE) {
    const batch = db.batch();
    writes.slice(i, i + CHUNK_SIZE).forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
  }
}

async function run() {
  console.log(isDryRun ? "DRY RUN — nothing will actually be written.\n" : "LIVE RUN — documents will be created.\n");

  const usedRegos = new Set();
  const bookedSlots = new Set(); // key: "YYYY-MM-DD_hour" — shared across future+past to avoid same-day/time reuse across both
  const writes = [];

  // ---- Customers ----
  const customers = [];
  for (let i = 0; i < NUM_CUSTOMERS; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const ref = db.collection("users").doc();
    const customer = {
      id: ref.id,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.mock${i}@example.com`,
      phone: `02${randomInt(10000000, 99999999)}`,
      role: "customer",
      active: true,
      notificationPreferences: {
        email: true,
        browser: false,
        sms: false, // SMS disabled app-wide, matches reality
      },
      isMockData: true,
    };
    customers.push(customer);

    const { id, ...customerData } = customer;
    writes.push({ ref, data: customerData });
  }

  // ---- Vehicle status distribution ----
  const vehicleSlots = [];
  customers.forEach((customer, idx) => {
    const count = randomInt(MIN_VEHICLES, MAX_VEHICLES);
    for (let i = 0; i < count; i++) vehicleSlots.push(idx);
  });

  const shuffledSlots = shuffle(vehicleSlots.map((customerIdx, i) => ({ customerIdx, i })));
  const overdueCount = Math.min(OVERDUE_TARGET, shuffledSlots.length);
  const dueSoonCount = Math.min(DUE_SOON_TARGET, shuffledSlots.length - overdueCount);

  const vehicles = [];
  shuffledSlots.forEach((slot, i) => {
    const status = i < overdueCount ? "overdue" : i < overdueCount + dueSoonCount ? "dueSoon" : "future";
    const customer = customers[slot.customerIdx];
    const vehicleDef = pick(MOCK_VEHICLES);
    const { nextWofDate, nextOilChangeDate } = buildVehicleDates(status);

    const ref = db.collection("vehicles").doc();
    const vehicle = {
      id: ref.id,
      make: vehicleDef.make,
      model: pick(vehicleDef.models),
      year: randomInt(2005, 2023),
      mileage: randomInt(20000, 180000),
      rego: randomRego(usedRegos),
      ownerId: customer.id,
      nextWofDate,
      nextOilChangeDate,
      status, // kept only in-memory for notification logic below, stripped before writing
      isMockData: true,
    };
    vehicles.push(vehicle);

    writes.push({
      ref,
      data: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        rego: vehicle.rego,
        ownerId: vehicle.ownerId,
        nextWofDate: Timestamp.fromDate(nextWofDate),
        nextOilChangeDate: Timestamp.fromDate(nextOilChangeDate),
        isMockData: true,
      },
    });
  });

  // ---- Notifications (80% of customers get 1-2) ----
  let notificationCount = 0;
  customers.forEach((customer) => {
    if (Math.random() > 0.8) return; // ~20% get none, for realism

    const ownedVehicles = vehicles.filter((v) => v.ownerId === customer.id);
    if (ownedVehicles.length === 0) return;

    const count = randomInt(1, 2);
    for (let i = 0; i < count; i++) {
      const vehicle = pick(ownedVehicles);
      const wofIsPast = vehicle.nextWofDate < new Date();
      const oilIsPast = vehicle.nextOilChangeDate < new Date();

      let type, content;
      const vehicleForTemplate = {
        ...vehicle,
        nextWofDate: Timestamp.fromDate(vehicle.nextWofDate),
        nextOilChangeDate: Timestamp.fromDate(vehicle.nextOilChangeDate),
      };

      if (wofIsPast || (!oilIsPast && Math.random() < 0.5)) {
        type = "wofDue";
        content = buildWofDueContent(vehicleForTemplate, customer);
      } else if (oilIsPast || true) {
        type = "oilChangeDue";
        content = buildOilChangeDueContent(vehicleForTemplate, customer);
      }

      const sentAt = addDays(new Date(), -randomInt(0, DUE_SOON_WINDOW_DAYS));
      const ref = db.collection("notifications").doc();
      writes.push({
        ref,
        data: {
          customerId: customer.id,
          vehicleId: vehicle.id,
          type,
          message: content.message,
          sentAt: Timestamp.fromDate(sentAt),
          read: Math.random() < 0.6,
          deliveryStatus: { email: "sent" },
          isMockData: true,
        },
      });
      notificationCount++;
    }
  });

  // ---- Appointments: past completed (~35% of customers) ----
  let pastAppointmentCount = 0;
  customers.forEach((customer) => {
    if (Math.random() > 0.35) return;
    const ownedVehicles = vehicles.filter((v) => v.ownerId === customer.id);
    if (ownedVehicles.length === 0) return;

    const vehicle = pick(ownedVehicles);
    const date = pickWorkingSlot(1, DUE_SOON_WINDOW_DAYS, bookedSlots, "past");
    if (!date) return;

    const ref = db.collection("appointments").doc();
    writes.push({
      ref,
      data: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        date: Timestamp.fromDate(date),
        serviceType: pick(SERVICE_TYPES),
        status: "completed",
        postServiceNotes: "Routine service completed, no issues found.",
        createdAt: Timestamp.fromDate(addDays(date, -2)),
        isMockData: true,
      },
    });
    pastAppointmentCount++;
  });

  // ---- Appointments: future pending/confirmed (~35% of customers) ----
  let futureAppointmentCount = 0;
  customers.forEach((customer) => {
    if (Math.random() > 0.35) return;
    const ownedVehicles = vehicles.filter((v) => v.ownerId === customer.id);
    if (ownedVehicles.length === 0) return;

    const vehicle = pick(ownedVehicles);
    const date = pickWorkingSlot(1, 21, bookedSlots, "future");
    if (!date) return;

    const ref = db.collection("appointments").doc();
    writes.push({
      ref,
      data: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        date: Timestamp.fromDate(date),
        serviceType: pick(SERVICE_TYPES),
        status: Math.random() < 0.5 ? "confirmed" : "pending",
        createdAt: Timestamp.fromDate(addDays(new Date(), -randomInt(0, 5))),
        isMockData: true,
      },
    });
    futureAppointmentCount++;
  });

  // ---- Summary ----
  console.log(`Customers:          ${customers.length}`);
  console.log(`Vehicles:           ${vehicles.length}  (overdue: ${overdueCount}, due soon: ${dueSoonCount}, future: ${vehicles.length - overdueCount - dueSoonCount})`);
  console.log(`Notifications:      ${notificationCount}`);
  console.log(`Past appointments:  ${pastAppointmentCount}`);
  console.log(`Future appointments:${futureAppointmentCount}`);
  console.log(`Total documents:    ${writes.length}`);

  if (isDryRun) {
    console.log("\n[dry-run] No documents were written.");
    return;
  }

  await commitInChunks(writes);
  console.log("\nDone.");
}

run().catch((err) => {
  console.error("Error seeding mock data:", err);
  process.exit(1);
});