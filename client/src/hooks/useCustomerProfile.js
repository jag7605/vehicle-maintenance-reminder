import { useEffect, useState } from "react";
import { addVehicle, getVehiclesByOwner, updateVehicle, deleteVehicle } from "../firebase/vehicles";
import { getCustomerById, setCustomerActiveStatus } from "../firebase/users";
import { vehicleMakesModels } from "../data/vehicleMakesModels";
import { timestampToDateInput } from "../utils/formatters";

const API_URL = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------------------------
// useCustomerProfile
//
// Owns every piece of state and every handler for the Admin Customer Profile
// page: loading the customer + their vehicles, the add-vehicle form, the
// edit/delete/status-toggle popups, and the send-reminder / history actions.
// ---------------------------------------------------------------------------
export function useCustomerProfile(customerId) {
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Add Vehicle form
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [rego, setRego] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit popup
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editYear, setEditYear] = useState("");
  const [editMileage, setEditMileage] = useState("");
  const [editRego, setEditRego] = useState("");
  const [editNextServiceDate, setEditNextServiceDate] = useState(""); // yyyy-MM-dd string
  const [editNextServiceMileage, setEditNextServiceMileage] = useState(""); // number string or ""
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete popup
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Activate/Deactivate popup
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  // Send Reminder — keyed by vehicleId so buttons are independent
  const [reminderLoading, setReminderLoading] = useState({});
  const [reminderResult, setReminderResult] = useState({});

  // Notification history — which vehicleId is expanded
  const [expandedHistory, setExpandedHistory] = useState({});

  async function refreshVehicles() {
    const updatedVehicles = await getVehiclesByOwner(customerId);
    setVehicles(updatedVehicles);
  }

  useEffect(() => {
    async function loadCustomerData() {
      try {
        const [customerData, vehicleData] = await Promise.all([
          getCustomerById(customerId),
          getVehiclesByOwner(customerId),
        ]);
        setCustomer(customerData);
        setVehicles(vehicleData);
      } catch {
        setPageError("Failed to load customer details.");
      } finally {
        setPageLoading(false);
      }
    }

    loadCustomerData();
  }, [customerId]);

  // --- Add Vehicle form ------------------------------------------------

  function handleMakeChange(e) {
    setMake(e.target.value);
    setModel("");
  }

  async function handleAddVehicle(e) {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    setAddLoading(true);

    try {
      await addVehicle({
        make,
        model,
        year: Number(year),
        mileage: Number(mileage),
        rego,
        ownerId: customerId,
      });

      setAddSuccess("Vehicle added successfully.");
      setMake("");
      setModel("");
      setYear("");
      setMileage("");
      setRego("");

      await refreshVehicles();
    } catch {
      setAddError("Something went wrong while adding the vehicle.");
    } finally {
      setAddLoading(false);
    }
  }

  // --- Edit popup --------------------------------------------------------

  function openEditPopup(vehicle) {
    setEditingVehicle(vehicle);
    setEditYear(vehicle.year);
    setEditMileage(vehicle.mileage);
    setEditRego(vehicle.rego);
    setEditNextServiceDate(timestampToDateInput(vehicle.nextServiceDate));
    setEditNextServiceMileage(vehicle.nextServiceMileage != null ? String(vehicle.nextServiceMileage) : "");
    setEditError("");
  }

  function closeEditPopup() {
    setEditingVehicle(null);
  }

  async function handleEditSave(e) {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);

    try {
      const nextServiceDate = editNextServiceDate ? new Date(editNextServiceDate) : null;
      const nextServiceMileage = editNextServiceMileage !== "" ? Number(editNextServiceMileage) : null;

      await updateVehicle(editingVehicle.id, {
        year: Number(editYear),
        mileage: Number(editMileage),
        rego: editRego,
        nextServiceDate,
        nextServiceMileage,
      });

      await refreshVehicles();
      setEditingVehicle(null);
    } catch {
      setEditError("Something went wrong while saving changes.");
    } finally {
      setEditLoading(false);
    }
  }

  // --- Delete popup --------------------------------------------------------

  function openDeletePopup(vehicle) {
    setDeletingVehicle(vehicle);
    setDeleteError("");
  }

  function closeDeletePopup() {
    setDeletingVehicle(null);
  }

  async function handleDeleteConfirm() {
    setDeleteError("");
    setDeleteLoading(true);

    try {
      await deleteVehicle(deletingVehicle.id);
      await refreshVehicles();
      setDeletingVehicle(null);
    } catch {
      setDeleteError("Something went wrong while deleting the vehicle.");
    } finally {
      setDeleteLoading(false);
    }
  }

  // --- Activate/Deactivate popup -------------------------------------------

  function openStatusConfirm() {
    setStatusError("");
    setShowStatusConfirm(true);
  }

  function closeStatusConfirm() {
    setShowStatusConfirm(false);
  }

  async function handleToggleActive() {
    const isCurrentlyActive = customer.active !== false;
    const nextStatus = !isCurrentlyActive;

    setStatusError("");
    setStatusLoading(true);

    try {
      await setCustomerActiveStatus(customerId, nextStatus);
      setCustomer((prev) => ({ ...prev, active: nextStatus }));
      setShowStatusConfirm(false);
    } catch {
      setStatusError("Something went wrong while updating status.");
    } finally {
      setStatusLoading(false);
    }
  }

  // --- Send Reminder — POST /api/admin/send-reminder/:vehicleId -----------

  async function handleSendReminder(vehicleId) {
    setReminderLoading((prev) => ({ ...prev, [vehicleId]: true }));
    setReminderResult((prev) => ({ ...prev, [vehicleId]: null }));

    try {
      const res = await fetch(`${API_URL}/api/admin/send-reminder/${vehicleId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReminderResult((prev) => ({
          ...prev,
          [vehicleId]: { success: true, deliveryStatus: data.deliveryStatus },
        }));
      } else {
        setReminderResult((prev) => ({
          ...prev,
          [vehicleId]: { success: false, error: data.error || "Unknown error." },
        }));
      }
    } catch {
      setReminderResult((prev) => ({
        ...prev,
        [vehicleId]: { success: false, error: "Could not reach the server." },
      }));
    } finally {
      setReminderLoading((prev) => ({ ...prev, [vehicleId]: false }));
    }
  }

  function toggleHistory(vehicleId) {
    setExpandedHistory((prev) => ({ ...prev, [vehicleId]: !prev[vehicleId] }));
  }

  const availableModels = make ? vehicleMakesModels[make] : [];
  const isActive = customer ? customer.active !== false : true;

  return {
    customer,
    vehicles,
    pageLoading,
    pageError,
    isActive,

    addVehicleForm: {
      make,
      model,
      year,
      mileage,
      rego,
      error: addError,
      success: addSuccess,
      loading: addLoading,
      availableModels,
      setMake: handleMakeChange,
      setModel,
      setYear,
      setMileage,
      setRego,
      onSubmit: handleAddVehicle,
    },

    editPopup: {
      vehicle: editingVehicle,
      year: editYear,
      mileage: editMileage,
      rego: editRego,
      nextServiceDate: editNextServiceDate,
      nextServiceMileage: editNextServiceMileage,
      error: editError,
      loading: editLoading,
      setYear: setEditYear,
      setMileage: setEditMileage,
      setRego: setEditRego,
      setNextServiceDate: setEditNextServiceDate,
      setNextServiceMileage: setEditNextServiceMileage,
      open: openEditPopup,
      close: closeEditPopup,
      onSave: handleEditSave,
    },

    deletePopup: {
      vehicle: deletingVehicle,
      loading: deleteLoading,
      error: deleteError,
      open: openDeletePopup,
      close: closeDeletePopup,
      onConfirm: handleDeleteConfirm,
    },

    statusPopup: {
      show: showStatusConfirm,
      loading: statusLoading,
      error: statusError,
      open: openStatusConfirm,
      close: closeStatusConfirm,
      onConfirm: handleToggleActive,
    },

    reminderLoading,
    reminderResult,
    expandedHistory,
    handleSendReminder,
    toggleHistory,
  };
}