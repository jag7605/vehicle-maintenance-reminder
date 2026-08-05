import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import logout from "../firebase/logout.js";
import { MdLogout } from "react-icons/md";

function Sidebar({ menuItems, userName, userRole }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-menu">
        {menuItems.map((section) => (
          <div key={section.title} className="sidebar-section">
            <h3>{section.title}</h3>

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
      </div>

      <div className="sidebar-footer">
        <button className="logout-button" onClick={logout}>
          <span>Logout</span>
          <MdLogout size={22} />
        </button>

        <div className="user-row">
          <div className="user-avatar">
            <img src="/avatar-placeholder.png" alt="User avatar" />
          </div>

          <div className="user-info">
            {userName && <strong>{userName}</strong>}
            <p>{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;