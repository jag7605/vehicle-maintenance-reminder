import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import logout from "../firebase/logout.js";


function Sidebar({ menuItems }) {
  return (
    <aside className="sidebar">
      {menuItems.map((section) => (
        <div key={section.title} className="sidebar-section">
          <h3>{section.title}</h3>

          {section.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="sidebar-link"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}

export default Sidebar;