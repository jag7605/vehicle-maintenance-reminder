import Sidebar from "./Sidebar";
import "./StaffLayout.css";

const adminMenu = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/admin/home" },
      { label: "Notifications", path: "/admin/notifications" },
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

function StaffLayout({ children }) {
  return (
    <>

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