import { useState } from "react";
import StaffLayout from "../component/StaffLayout";
import JobCompleteModal from "../component/JobCompleteModal";
import { useAdminJobs } from "../hooks/useAdminJobs";
import "./AdminJobsPage.css";

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
  const [completionResult, setCompletionResult] = useState(null);

  function openCompleteModal(job) {
    setSelectedJob(job);
    setCompletionResult(null);
  }

  function closeCompleteModal() {
    setSelectedJob(null);
    setCompletionResult(null);
  }

  async function handleConfirmComplete(postServiceNotes) {
    if (!selectedJob) return;

    const result = await markJobComplete(selectedJob.id, postServiceNotes);
    if (result) {
      setCompletionResult(result);
    }
    // On failure, the modal stays open and shows actionError for this job
    // so the admin can see what went wrong and retry.
  }

  return (
    <StaffLayout title="Jobs">
      <div className="page-header">
        <h1>Today's Jobs</h1>
      </div>
      <p className="page-intro-text">
        Confirmed bookings scheduled for today. "Mark as Complete" unlocks
        once a job's booked start time has passed.
      </p>

      {loading && <p>Loading today's jobs...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p>No confirmed jobs scheduled for today.</p>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="jobs-table-scroll">
          <table className="jobs-table">
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
                  <td className="time-cell">{formatTime(job.date)}</td>
                  <td>{job.customerName}</td>
                  <td>{job.vehicleLabel}</td>
                  <td>
                    {[job.serviceType, ...(job.additionalServiceTypes || [])]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>
                  <td className="notes-cell">
                    {job.notes || "—"}
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${
                        !job.canComplete || actionLoading[job.id] ? "btn-disabled" : "btn-primary"
                      }`}
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
          completionResult={completionResult}
        />
      )}
    </StaffLayout>
  );
}

export default AdminJobsPage;