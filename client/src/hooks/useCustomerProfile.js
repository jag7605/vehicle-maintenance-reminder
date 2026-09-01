import { useEffect, useState } from "react";
import { addVehicle, getVehiclesByOwner, updateVehicle, deleteVehicle } from "../firebase/vehicles";
import { getCustomerById, setCustomerActiveStatus } from "../firebase/users";
import { vehicleMakesModels } from "../data/vehicleMakesModels";
import { timestampToDateInput, isPastDate } from "../utils/formatters";
import { calculateNextWoFDate, calculateNextOilChangeDate } from "../utils/serviceDateCalculators";
import { invalidateAdminCustomersCache } from "./useAdminCustomers";
import { invalidateDashboardSummaryCache } from "./useDashboardSummary";
 
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
  const [lastOilChangeDate, setLastOilChangeDate] = useState("");
  const [lastWofDate, setLastWofDate] = useState("");
  const [addedVehicleDetails, setAddedVehicleDetails] = useState(null);
 
  // Edit popup
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editYear, setEditYear] = useState("");
  const [editMileage, setEditMileage] = useState("");
  const [editRego, setEditRego] = useState("");
  const [editNextWofDate, setEditNextWofDate] = useState(""); // yyyy-MM-dd string
  const [editNextOilChangeDate, setEditNextOilChangeDate] = useState(""); // yyyy-MM-dd string
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
      const vehicleYear = Number(year);
      const now = new Date();

      // WoF: use the provided Last WoF Date as the reference point if given,
      // otherwise fall back to today. Age-band calculation uses whichever
      // date is passed in.
      const wofReferenceDate = lastWofDate ? new Date(lastWofDate) : now;
      const nextWofDate = calculateNextWoFDate({ year: vehicleYear }, wofReferenceDate);

      // Oil Change prefill is optional — only calculated if the admin
      // provided a last Oil Change date. If left blank, nextOilChangeDate
      // stays unset until the vehicle's first real Oil Change completion.
      const nextOilChangeDate = lastOilChangeDate
        ? calculateNextOilChangeDate(new Date(lastOilChangeDate))
        : null;

      await addVehicle({
        make,
        model,
        year: vehicleYear,
        mileage: Number(mileage),
        rego,
        ownerId: customerId,
        nextWofDate,
        nextOilChangeDate,
      });
 
      setAddSuccess("Vehicle added successfully.");
      setAddedVehicleDetails({
        make,
        model,
        year: vehicleYear,
        rego,
        nextWofDate,
        nextOilChangeDate,
      });
      setMake("");
      setModel("");
      setYear("");
      setMileage("");
      setRego("");
      setLastWofDate("");
      setLastOilChangeDate("");
 
      await refreshVehicles();
    } catch {
      setAddError("Something went wrong while adding the vehicle.");
    } finally {
      setAddLoading(false);
    }
  }

  function closeAddedVehicleDetails() {
    setAddedVehicleDetails(null);
  }

  // --- Edit popup --------------------------------------------------------
 
  function openEditPopup(vehicle) {
    setEditingVehicle(vehicle);
    setEditYear(vehicle.year);
    setEditMileage(vehicle.mileage);
    setEditRego(vehicle.rego);
    setEditNextWofDate(timestampToDateInput(vehicle.nextWofDate));
    setEditNextOilChangeDate(timestampToDateInput(vehicle.nextOilChangeDate));
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
      const nextWofDate = editNextWofDate ? new Date(editNextWofDate) : null;
      const nextOilChangeDate = editNextOilChangeDate ? new Date(editNextOilChangeDate) : null;

      await updateVehicle(editingVehicle.id, {
        year: Number(editYear),
        mileage: Number(editMileage),
        rego: editRego,
        nextWofDate,
        nextOilChangeDate,
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
      invalidateAdminCustomersCache();
      invalidateDashboardSummaryCache();
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
      lastWofDate,
      lastOilChangeDate,
      error: addError,
      success: addSuccess,
      loading: addLoading,
      availableModels,
      addedVehicleDetails,
      setMake: handleMakeChange,
      setModel,
      setYear,
      setMileage,
      setRego,
      setLastWofDate,
      setLastOilChangeDate,
      onSubmit: handleAddVehicle,
      closeAddedVehicleDetails,
    },
 
    editPopup: {
      vehicle: editingVehicle,
      year: editYear,
      mileage: editMileage,
      rego: editRego,
      nextWofDate: editNextWofDate,
      nextOilChangeDate: editNextOilChangeDate,
      error: editError,
      loading: editLoading,
      setYear: setEditYear,
      setMileage: setEditMileage,
      setRego: setEditRego,
      setNextWofDate: setEditNextWofDate,
      setNextOilChangeDate: setEditNextOilChangeDate,
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
      wofDuePastDue: notifyingVehicle ? isPastDate(notifyingVehicle.nextWofDate) : false,
      oilChangeDuePastDue: notifyingVehicle ? isPastDate(notifyingVehicle.nextOilChangeDate) : false,
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