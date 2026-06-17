import { NavLink } from "react-router-dom";
import "./CustomerSidebar.css";

const menuItems = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", path: "/customer/home" },
            { label: "Notifications", path: "/customer/notifications" }
        ]
    },
    {
        title: "Services",
        items: [
            { label: "Appointments", path: "/customer/appointments" },
            { label: "My Vehicles", path: "/customer/vehicles" },
            { label: "Service History", path: "/customer/history" }
        ]
    },
    {
        title: "Account",
        items: [
            { label: "Profile", path: "/customer/profile" },
        ]
    }
];


function CustomerSidebar() {
    return (
        <aside className="customer-sidebar">
            <div className="sidebar-header">
                <h2>Customer Menu</h2>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((section) => (
                    <div key={section.title} className="sidebar-section">
                        <p className="sidebar-section-title">{section.title}</p>

                        {section.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    isActive ? "sidebar-link active" : "sidebar-link"
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}

                    </div>
                ))}


            </nav>
            <div className="sidebar-footer">

                <button className="logout-button">
                    Logout
                </button>

                <div className="user-row">
                    <div className="user-avatar">
                        <img src="/avatar-placeholder.png" alt="User avatar" />
                    </div>

                    <div className="user-info">
                        <strong>Name</strong>
                        <p>Role</p>
                    </div>
                </div>
            </div>
        </aside>);

}

export default CustomerSidebar;