import Topbar from "./TopBar";
import Sidebar from "./Sidebar";
import "./StaffLayout.css";

const adminMenu = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/admin/home" },
      { label: "Notifications", path: "/admin/notifications" },
      { label: "Notification Preferences", path: "/admin/notification-preferences" },
    ],
  },
  {
    title: "Workshop",
    items: [
      { label: "Jobs", path: "/admin/jobs" },
      { label: "Bookings", path: "/admin/bookings" },
    ],
  },
  {
    title: "Records",
    items: [
      { label: "Customers", path: "/admin/customers" },
    ],
  },
];

function StaffLayout({ title, children }) {
  return (
    <>
      <Topbar title={title} logoText="Garage Staff" buttonText="+ New Job" />

      <div className="dashboard-layout">
        <Sidebar menuItems={adminMenu} userRole="Admin" />

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </>
  );
}

export default StaffLayout;