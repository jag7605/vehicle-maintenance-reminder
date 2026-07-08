import { useEffect, useState } from "react";
import { addVehicle, getVehiclesByOwner, updateVehicle, deleteVehicle } from "../firebase/vehicles";
import { getCustomerById, setCustomerActiveStatus } from "../firebase/users";
import { vehicleMakesModels } from "../data/vehicleMakesModels";
import { timestampToDateInput, isPastDate } from "../utils/formatters";
 
const API_URL = import.meta.env.VITE_API_URL;

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
 
  // Send Notification popup — which vehicle it's open for, plus per-vehicle
  // loading/result state so multiple rows stay independent
  const [notifyingVehicle, setNotifyingVehicle] = useState(null);
  const [notifyError, setNotifyError] = useState("");
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
 
  // --- Send Notification popup ---------------------------------------------
  // Opens a popup asking which message type to send for a given vehicle.
 
  function openNotifyPopup(vehicle) {
    setNotifyingVehicle(vehicle);
    setNotifyError("");
  }
 
  function closeNotifyPopup() {
    setNotifyingVehicle(null);
    setNotifyError("");
  }
 
  // type: "serviceDue" | "carReady"
  // NOTE: the backend route accepts { type } in the POST body and branches
  // on it to pick the message template.
  async function handleSendNotification(type) {
    if (!notifyingVehicle) return;
 
    // Guard: don't let admins send a "Service Due" reminder once the
    // service date has already passed — the message reads oddly ("due on
    // [date in the past]") and the customer should get a different message
    // by then anyway. Checked here too, not just via the disabled button,
    // so this can't be bypassed.
    if (type === "serviceDue" && isPastDate(notifyingVehicle.nextServiceDate)) {
      setNotifyError(
        "This vehicle's service date has already passed. Update the service date, or send \"Your Car Is Ready\" instead."
      );
      return;
    }
 
    const vehicleId = notifyingVehicle.id;
 
    setNotifyError("");
    setReminderLoading((prev) => ({ ...prev, [vehicleId]: true }));
    setReminderResult((prev) => ({ ...prev, [vehicleId]: null }));
 
    try {
      const res = await fetch(`${API_URL}/api/admin/send-reminder/${vehicleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
 
      if (res.ok && data.success) {
        setReminderResult((prev) => ({
          ...prev,
          [vehicleId]: { success: true, deliveryStatus: data.deliveryStatus },
        }));
        setNotifyingVehicle(null);
      } else {
        setNotifyError(data.error || "Unknown error.");
      }
    } catch {
      setNotifyError("Could not reach the server.");
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
 
    notifyPopup: {
      vehicle: notifyingVehicle,
      // Computed here, once, rather than in the modal — keeps the "what
      // counts as past due" rule in one place alongside the same check
      // handleSendNotification uses.
      serviceDuePastDue: notifyingVehicle ? isPastDate(notifyingVehicle.nextServiceDate) : false,
      error: notifyError,
      loading: notifyingVehicle ? !!reminderLoading[notifyingVehicle.id] : false,
      open: openNotifyPopup,
      close: closeNotifyPopup,
      onSelect: handleSendNotification,
    },
 
    reminderLoading,
    reminderResult,
    expandedHistory,
    toggleHistory,
  };
}