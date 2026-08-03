function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return date.toLocaleString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status) {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function BookingDetailModal({
  appointment,
  onClose,
  onConfirm,
  onReject,
  loading,
  error,
}) {
  const { status } = appointment;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div style={{ backgroundColor: "white", padding: "20px", minWidth: "340px", borderRadius: "6px" }}>
        <h3>{appointment.vehicleLabel}</h3>

        <p><strong>Customer:</strong> {appointment.customerName}</p>
        {appointment.customerPhone && <p><strong>Phone:</strong> {appointment.customerPhone}</p>}
        <p><strong>Date:</strong> {formatDate(appointment.date)}</p>
        <p><strong>Service type:</strong> {[appointment.serviceType, ...(appointment.additionalServiceTypes || [])].filter(Boolean).join(", ") || "—"}</p>
        <p><strong>Status:</strong> {formatStatus(status)}</p>
        {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}

        {status === "confirmed" && (
          <p style={{ color: "#555", fontSize: "0.9em" }}>
            To mark this job as complete, use the Jobs page.
          </p>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
          {status === "pending" && (
            <>
              <button onClick={onConfirm} disabled={loading}>
                {loading ? "Working..." : "Confirm"}
              </button>
              <button onClick={onReject} disabled={loading}>
                {loading ? "Working..." : "Reject"}
              </button>
            </>
          )}

          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingDetailModal;