import { useEffect, useState } from "react";
import Topbar from "./TopBar";
import Sidebar from "./Sidebar";
import "./StaffLayout.css";
import { Outlet } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";
import { getCustomerById } from "../firebase/users";

const customerMenu = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/customer/home" },
      { label: "Notifications", path: "/customer/notifications" }
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
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    async function loadCustomerName() {
      try {
        const uid = auth.currentUser.uid;
        const customer = await getCustomerById(uid);
        setCustomerName(`${customer.firstName} ${customer.lastName}`);
      } catch (err) {
        console.error("Failed to load customer name:", err);
      }
    }

    loadCustomerName();
  }, []);

  return (
    <>
      <Topbar title="Customer Dashboard" logoText="Customer Portal" />

      <div className="dashboard-layout">
        <Sidebar menuItems={customerMenu} userName={customerName} userRole="Customer" />

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default CustomerLayout;