import { useState } from "react";
import StaffLayout from "../component/StaffLayout";
import JobCompleteModal from "../component/JobCompleteModal";
import { useAdminJobs } from "../hooks/useAdminJobs";

function formatTime(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return date.toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" });
}

// Admin Jobs Page — today's confirmed bookings, with a time-gated
// "Mark as Complete" action that opens a confirmation popup collecting
// postServiceNotes before calling the dedicated completion endpoint.
function AdminJobsPage() {
  const {
    jobs,
    loading,
    error,
    actionLoading,
    actionError,
    markJobComplete,
  } = useAdminJobs();

  const [selectedJob, setSelectedJob] = useState(null);

  function openCompleteModal(job) {
    setSelectedJob(job);
  }

  function closeCompleteModal() {
    setSelectedJob(null);
  }

  async function handleConfirmComplete(postServiceNotes) {
    if (!selectedJob) return;

    const success = await markJobComplete(selectedJob.id, postServiceNotes);
    if (success) {
      setSelectedJob(null);
    }
    // On failure, the modal stays open and shows actionError for this job
    // so the admin can see what went wrong and retry.
  }

  return (
    <StaffLayout title="Jobs">
      <h2>Today's Jobs</h2>
      <p style={{ color: "#555", marginBottom: "12px" }}>
        Confirmed bookings scheduled for today. "Mark as Complete" unlocks
        once a job's booked start time has passed.
      </p>

      {loading && <p>Loading today's jobs...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p>No confirmed jobs scheduled for today.</p>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Service Type</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{formatTime(job.date)}</td>
                  <td>{job.customerName}</td>
                  <td>{job.vehicleLabel}</td>
                  <td>
                    {[job.serviceType, ...(job.additionalServiceTypes || [])]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>
                  <td style={{ maxWidth: "240px", wordBreak: "break-word" }}>
                    {job.notes || "—"}
                  </td>
                  <td>
                    <button
                      onClick={() => openCompleteModal(job)}
                      disabled={!job.canComplete || actionLoading[job.id]}
                      title={
                        !job.canComplete
                          ? "Available once the booked start time has passed"
                          : undefined
                      }
                    >
                      {actionLoading[job.id] ? "Working..." : "Mark as Complete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedJob && (
        <JobCompleteModal
          job={selectedJob}
          onClose={closeCompleteModal}
          onConfirm={handleConfirmComplete}
          loading={actionLoading[selectedJob.id]}
          error={actionError[selectedJob.id]}
        />
      )}
    </StaffLayout>
  );
}

export default AdminJobsPage;