import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const API_URL = import.meta.env.VITE_API_URL;

export async function getAllAppointments() {
  // Admin view — no filter needed, isAdmin() rule allows full read.
  const q = query(collection(db, "appointments"), orderBy("date", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getAppointmentsByCustomer(customerId) {
  const q = query(
    collection(db, "appointments"),
    where("customerId", "==", customerId)
  );

  const snapshot = await getDocs(q);

  const appointments = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return appointments.sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return dateA - dateB;
  });
}

export async function getAvailability(dateString) {
  // dateString must be "YYYY-MM-DD"
  const res = await fetch(
    `${API_URL}/api/admin/appointments/availability?date=${dateString}`
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to load availability.");
  }

  return data; // { date, closed, slots: [{ time, available }] }
}

export async function updateAppointmentStatus(appointmentId, status) {
  const res = await fetch(
    `${API_URL}/api/admin/appointments/${appointmentId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to update appointment status.");
  }

  return data; // { success, deliveryStatus }
}

// Dedicated completion endpoint — separate from updateAppointmentStatus
// because completion accepts postServiceNotes and is server-side
// time-gated (the appointment's booked time must have passed).
export async function completeAppointment(appointmentId, postServiceNotes = "") {
  const res = await fetch(
    `${API_URL}/api/admin/appointments/${appointmentId}/complete`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postServiceNotes }),
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to complete appointment.");
  }

  return data; // { success, appointment }
}

export async function createAppointment(
  customerId,
  vehicleId,
  date,
  serviceType,
  notes = "",
  additionalServiceTypes = []
) {
  const appointmentData = {
    customerId,
    vehicleId,
    date: Timestamp.fromDate(date),
    serviceType: serviceType || "",
    status: "pending",
    createdAt: Timestamp.now(),
  };

  if (notes.trim() !== "") {
    appointmentData.notes = notes.trim();
  }

  const cleanedAdditional = additionalServiceTypes.filter((type) => type !== "");
  if (cleanedAdditional.length > 0) {
    appointmentData.additionalServiceTypes = cleanedAdditional;
  }

  const docRef = await addDoc(collection(db, "appointments"), appointmentData);

  return {
    id: docRef.id,
    ...appointmentData,
  };
}

export async function createAppointmentAsAdmin(
  customerId,
  vehicleId,
  date,
  serviceType,
  notes = "",
  additionalServiceTypes = []
) {
  const created = await createAppointment(
    customerId,
    vehicleId,
    date,
    serviceType,
    notes,
    additionalServiceTypes
  );

  await updateAppointmentStatus(created.id, "confirmed");

  return { ...created, status: "confirmed" };
}

export async function cancelAppointment(appointmentId) {
  const apptRef = doc(db, "appointments", appointmentId);
  await updateDoc(apptRef, { status: "cancelled" });
}