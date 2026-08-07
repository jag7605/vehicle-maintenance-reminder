import { useState } from "react";
import "./JobCompleteModal.css";

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

function JobCompleteModal({ job, onClose, onConfirm, loading, error, completionResult }) {
  const [postServiceNotes, setPostServiceNotes] = useState("");

  function handleConfirm() {
    onConfirm(postServiceNotes.trim());
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {completionResult ? (
          <>
            <h3>Job Completed</h3>
            <p>The job was marked complete successfully.</p>

            <p><strong>Notification delivery:</strong></p>
            <ul>
              {Object.entries(completionResult.deliveryStatus || {}).map(([channel, status]) => (
                <li key={channel}>
                  {channel}: {status}
                </li>
              ))}
            </ul>

            <div className="modal-actions modal-actions-end">
              <button type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Mark Job Complete</h3>

            <p><strong>Customer:</strong> {job.customerName}</p>
            <p><strong>Vehicle:</strong> {job.vehicleLabel}</p>
            <p>
              <strong>Service type:</strong>{" "}
              {[job.serviceType, ...(job.additionalServiceTypes || [])].filter(Boolean).join(", ") || "—"}
            </p>
            <p><strong>Booked time:</strong> {formatDate(job.date)}</p>
            {job.notes && <p><strong>Customer notes:</strong> {job.notes}</p>}

            <div className="post-service-field">
              <label>Post-service notes</label><br />
              <textarea
                value={postServiceNotes}
                onChange={(e) => setPostServiceNotes(e.target.value)}
                placeholder="e.g. Used synthetic oil, replaced air filter"
                rows={3}
                className="textarea-full"
              />
            </div>

            <p className="confirm-note">
              Are you sure you want to mark this job as complete? This cannot be undone.
            </p>

            {error && <p className="error-text">{error}</p>}

            <div className="modal-actions modal-actions-top">
              <button onClick={handleConfirm} disabled={loading}>
                {loading ? "Completing..." : "Confirm Complete"}
              </button>
              <button type="button" onClick={onClose} disabled={loading}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default JobCompleteModal;