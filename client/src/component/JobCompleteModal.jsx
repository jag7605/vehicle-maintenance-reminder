import { useState } from "react";

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

// Confirmation popup shown before finalizing a job as complete. Follows the
// same fixed-overlay modal pattern as BookingDetailModal for consistency.
// Includes the postServiceNotes as part of the same confirmation step.
function JobCompleteModal({ job, onClose, onConfirm, loading, error }) {
  const [postServiceNotes, setPostServiceNotes] = useState("");

  function handleConfirm() {
    onConfirm(postServiceNotes.trim());
  }

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
      <div style={{ backgroundColor: "white", padding: "20px", minWidth: "360px", borderRadius: "6px" }}>
        <h3>Mark Job Complete</h3>

        <p><strong>Customer:</strong> {job.customerName}</p>
        <p><strong>Vehicle:</strong> {job.vehicleLabel}</p>
        <p><strong>Service type:</strong> {job.serviceType || "—"}</p>
        <p><strong>Booked time:</strong> {formatDate(job.date)}</p>
        {job.notes && <p><strong>Customer notes:</strong> {job.notes}</p>}

        <div style={{ marginTop: "12px" }}>
          <label>Post-service notes</label><br />
          <textarea
            value={postServiceNotes}
            onChange={(e) => setPostServiceNotes(e.target.value)}
            placeholder="e.g. Used synthetic oil, replaced air filter"
            rows={3}
            style={{ width: "100%", marginTop: "4px" }}
          />
        </div>

        <p style={{ color: "#555", fontSize: "0.9em", marginTop: "8px" }}>
          Are you sure you want to mark this job as complete? This cannot be undone.
        </p>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button onClick={handleConfirm} disabled={loading}>
            {loading ? "Completing..." : "Confirm Complete"}
          </button>
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobCompleteModal;