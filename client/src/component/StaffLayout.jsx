import Topbar from "./TopBar";
import Sidebar from "./Sidebar";
import "./StaffLayout.css";

function StaffLayout({ title, children }) {
  return (
    <>
      <Topbar title={title} />

      <div className="dashboard-layout">
        <Sidebar />

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </>
  );
}

export default StaffLayout;