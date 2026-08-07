import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { getAppointmentsByCustomer } from "../firebase/appointments";
import { formatDate } from "../utils/formatters";
import "./CustomerServiceHistoryPage.css";

function getAppointmentDate(appt) {
  return appt.date?.toDate ? appt.date.toDate() : new Date(appt.date);
}

function CustomerServiceHistoryPage() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("loading");

  const [vehicleFilter, setVehicleFilter] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      // auth.currentUser is guaranteed non-null here — ProtectedRoute has
      // already confirmed an authenticated session before rendering this page
      const uid = auth.currentUser.uid;

      try {
        const [appointmentData, vehicleSnapshot] = await Promise.all([
          getAppointmentsByCustomer(uid),
          getDocs(query(collection(db, "vehicles"), where("ownerId", "==", uid))),
        ]);

        const vehicleMap = new Map(
          vehicleSnapshot.docs.map((doc) => [doc.id, { id: doc.id, ...doc.data() }])
        );

        const completed = appointmentData
          .filter((appt) => appt.status === "completed")
          .map((appt) => ({
            ...appt,
            vehicle: vehicleMap.get(appt.vehicleId) || null,
          }))
          .sort((a, b) => getAppointmentDate(b) - getAppointmentDate(a)); // most recent first

        setAppointments(completed);
        setStatus("done");
      } catch (err) {
        console.error("Failed to fetch service history:", err);
        setStatus("error");
      }
    }

    fetchHistory();
  }, []);

  // Build filter option lists from the actual data — only vehicles/service
  // types that appear in this customer's completed history show up.
  const vehicleOptions = useMemo(() => {
    const map = new Map();
    appointments.forEach((appt) => {
      if (appt.vehicle) {
        map.set(appt.vehicle.id, `${appt.vehicle.year} ${appt.vehicle.make} ${appt.vehicle.model}`);
      }
    });
    return Array.from(map.entries()); // [id, label]
  }, [appointments]);

  const serviceTypeOptions = useMemo(() => {
    const set = new Set();
    appointments.forEach((appt) => {
      [appt.serviceType, ...(appt.additionalServiceTypes || [])]
        .filter(Boolean)
        .forEach((type) => set.add(type));
    });
    return Array.from(set).sort();
  }, [appointments]);

  const filteredAppointments = appointments.filter((appt) => {
    if (vehicleFilter && appt.vehicle?.id !== vehicleFilter) return false;
    if (serviceTypeFilter) {
      const types = [appt.serviceType, ...(appt.additionalServiceTypes || [])];
      if (!types.includes(serviceTypeFilter)) return false;
    }
    return true;
  });

  if (status === "loading") return <p>Loading service history...</p>;
  if (status === "error") return <p>Something went wrong. Please try again.</p>;
  if (appointments.length === 0) return <p>No completed services yet.</p>;

  return (
    <div>
      <h2>Service History</h2>

      <div className="history-filters">
        <label>
          Vehicle:{" "}
          <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
            <option value="">All vehicles</option>
            {vehicleOptions.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </label>
        {"  "}
        <label>
          Service type:{" "}
          <select value={serviceTypeFilter} onChange={(e) => setServiceTypeFilter(e.target.value)}>
            <option value="">All service types</option>
            {serviceTypeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
      </div>

      {filteredAppointments.length === 0 ? (
        <p>No services match the selected filters.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Rego</th>
              <th>Service Type</th>
              <th>Your Notes</th>
              <th>Service Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map((appt) => (
              <tr key={appt.id}>
                <td>{formatDate(appt.date)}</td>
                <td>
                  {appt.vehicle
                    ? `${appt.vehicle.year} ${appt.vehicle.make} ${appt.vehicle.model}`
                    : "—"}
                </td>
                <td>{appt.vehicle?.rego || "—"}</td>
                <td>
                  {[appt.serviceType, ...(appt.additionalServiceTypes || [])]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>
                <td>{appt.notes || "—"}</td>
                <td>{appt.postServiceNotes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CustomerServiceHistoryPage;