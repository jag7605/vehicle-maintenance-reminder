import Topbar from "./TopBar";
import Sidebar from "./Sidebar";
import "./StaffLayout.css";
import { Outlet } from "react-router-dom";

const customerMenu = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/customer/home" },
      { label: "Notifications", path: "/customer/notifications" },
      { label: "Notification Preferences", path: "/customer/notification-preferences" },
    ],
  },
  {
    title: "Services",
    items: [
      { label: "Appointments", path: "/customer/appointments" },
      { label: "My Vehicles", path: "/customer/vehicles" },
      { label: "Service History", path: "/customer/history" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", path: "/customer/profile" },
    ],
  },
];

function CustomerLayout() {
  return (
    <>
      <Topbar title="Customer Dashboard" logoText="Customer Portal" />

      <div className="dashboard-layout">
        <Sidebar menuItems={customerMenu} />

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default CustomerLayout;