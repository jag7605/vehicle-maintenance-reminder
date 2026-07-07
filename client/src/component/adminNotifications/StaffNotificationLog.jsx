function StaffNotificationLog() {
  return (
    <div
      style={{
        border: "1px dashed #aaa",
        padding: "16px",
        borderRadius: "4px",
        color: "#777",
        backgroundColor: "#fafafa",
      }}
    >
      <p style={{ margin: 0 }}>
        <strong>Coming in a future sprint</strong>
      </p>
      <p style={{ margin: "8px 0 0" }}>
        Internal staff alerts for job started, job completed, and booking
        confirmed events will appear here once Jobs, Bookings, and Task Tracker
        pages are built. These will be sourced from a separate{" "}
        <code>adminNotifications</code> Firestore collection.
      </p>
    </div>
  );
}
 
export default StaffNotificationLog;