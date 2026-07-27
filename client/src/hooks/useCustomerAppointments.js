import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  getAvailability,
  createAppointment,
  getAppointmentsByCustomer,
  cancelAppointment,
} from "../firebase/appointments";

export function getToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export function isPastDate(date) {
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return dateOnly < getToday();
}

export function isSunday(date) {
  return date.getDay() === 0;
}

export function isSameDay(date1, date2) {
  return (
    date1 &&
    date2 &&
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isWithinCancelWindow(date) {
  const now = new Date();
  const differenceHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
  return differenceHours < 24;
}

export function useCustomerAppointments() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availability, setAvailability] = useState(null);

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");

  useEffect(() => {
    async function loadPageData() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          setError("You must be logged in to book an appointment.");
          return;
        }

        const vehiclesQuery = query(
          collection(db, "vehicles"),
          where("ownerId", "==", user.uid)
        );

        const vehicleSnapshot = await getDocs(vehiclesQuery);

        const vehicleList = vehicleSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setVehicles(vehicleList);

        await loadUpcomingAppointments(user.uid, vehicleList);
      } catch (err) {
        console.error("Could not load page data:", err);
        setError("Could not load your appointment details.");
      }
    }

    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dayPropGetter(date) {
    if (isPastDate(date) || isSunday(date)) {
      return { className: "blocked-day" };
    }
    if (isSameDay(date, selectedDate)) {
      return { className: "selected-day" };
    }
    return {};
  }

  async function loadAvailability(date) {
    try {
      setLoading(true);
      setError("");

      const dateString = formatDateForApi(date);
      const data = await getAvailability(dateString);

      setAvailability(data);
    } catch (err) {
      console.error("Could not load availability:", err);
      setError("Could not load available appointment slots.");
    } finally {
      setLoading(false);
    }
  }

  async function loadUpcomingAppointments(customerId, vehicleList = vehicles) {
    try {
      const appointments = await getAppointmentsByCustomer(customerId);
      const now = new Date();

      const upcoming = appointments
        .filter((appointment) => {
          const appointmentDate = appointment.date?.toDate
            ? appointment.date.toDate()
            : new Date(appointment.date);

          const isUpcoming = appointmentDate >= now;
          const isActive =
            appointment.status === "pending" || appointment.status === "confirmed";

          return isUpcoming && isActive;
        })
        .map((appointment) => {
          const appointmentDate = appointment.date?.toDate
            ? appointment.date.toDate()
            : new Date(appointment.date);

          const vehicle = vehicleList.find((v) => v.id === appointment.vehicleId);

          let vehicleName = "Vehicle";
          if (vehicle) {
            const plate = vehicle.plate || vehicle.registration || vehicle.rego;
            vehicleName = plate
              ? `${vehicle.make} ${vehicle.model} - ${plate}`
              : `${vehicle.make} ${vehicle.model}`;
          }

          return { ...appointment, appointmentDate, vehicleName };
        });

      setUpcomingAppointments(upcoming);
    } catch (err) {
      console.error("Could not load upcoming appointments:", err);
    }
  }

  async function handleSelectDate(slotInfo) {
    const clickedDate = new Date(
      slotInfo.start.getFullYear(),
      slotInfo.start.getMonth(),
      slotInfo.start.getDate()
    );

    setBookingMessage("");

    if (isPastDate(clickedDate)) {
      setSelectedDate(null);
      setSelectedSlot("");
      setAvailability(null);
      setError("You cannot select a past date.");
      return;
    }

    if (isSunday(clickedDate)) {
      setSelectedDate(null);
      setSelectedSlot("");
      setAvailability(null);
      setError("The garage is closed on Sundays.");
      return;
    }

    setSelectedDate(clickedDate);
    setSelectedSlot("");

    await loadAvailability(clickedDate);
  }

  async function handleBookAppointment() {
    try {
      setError("");
      setBookingMessage("");

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("You must be logged in to book an appointment.");
        return;
      }
      if (!selectedDate) {
        setError("Please select a date.");
        return;
      }
      if (!selectedSlot) {
        setError("Please select an available time slot.");
        return;
      }
      if (!selectedVehicleId) {
        setError("Please select a vehicle.");
        return;
      }
      if (!serviceType) {
        setError("Please select a service type.");
        return;
      }

      setBookingLoading(true);

      const latestAvailability = await getAvailability(formatDateForApi(selectedDate));

      const slotStillAvailable = latestAvailability.slots.some(
        (slot) => slot.time === selectedSlot && slot.available
      );

      if (!slotStillAvailable) {
        setAvailability(latestAvailability);
        setSelectedSlot("");
        setError("This slot is no longer available. Please choose another slot.");
        return;
      }

      const [hour, minute] = selectedSlot.split(":").map(Number);

      const appointmentDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hour,
        minute
      );

      await createAppointment(
        user.uid,
        selectedVehicleId,
        appointmentDate,
        serviceType,
        notes
      );

      setBookingMessage("Appointment booking request submitted.");
      setSelectedSlot("");
      setServiceType("");
      setNotes("");

      await loadAvailability(selectedDate);
      await loadUpcomingAppointments(user.uid);

      return true; // signal success so the page can switch tabs
    } catch (err) {
      console.error("Could not book appointment:", err);
      setError(err.message || "Could not book appointment. Please try again.");
      return false;
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleCancelAppointment(appointment) {
    try {
      setError("");
      setBookingMessage("");

      if (isWithinCancelWindow(appointment.appointmentDate)) {
        setError(
          "This appointment can no longer be cancelled online because it starts in less than 24 hours."
        );
        return;
      }

      const confirmCancel = window.confirm(
        "Are you sure you want to cancel this appointment?"
      );
      if (!confirmCancel) return;

      await cancelAppointment(appointment.id);

      setBookingMessage("Appointment cancelled successfully.");

      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        await loadUpcomingAppointments(user.uid);
      }

      if (selectedDate) {
        await loadAvailability(selectedDate);
      }
    } catch (err) {
      console.error("Could not cancel appointment:", err);
      setError("Could not cancel appointment. Please try again.");
    }
  }

  return {
    // date/slot selection
    selectedDate,
    selectedSlot,
    setSelectedSlot,
    availability,
    loading,
    dayPropGetter,
    handleSelectDate,

    // booking form
    vehicles,
    selectedVehicleId,
    setSelectedVehicleId,
    serviceType,
    setServiceType,
    notes,
    setNotes,
    bookingLoading,
    handleBookAppointment,

    // upcoming list
    upcomingAppointments,
    handleCancelAppointment,

    // shared messaging
    error,
    bookingMessage,
  };
}