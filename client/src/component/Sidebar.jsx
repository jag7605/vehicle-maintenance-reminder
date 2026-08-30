import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./Sidebar.css";
import logout from "../firebase/logout.js";
import { MdLogout, MdBuild, MdPerson } from "react-icons/md";

function Sidebar({ menuItems, userName, userRole }) {
  const menuRef = useRef(null);
  const rippleId = useRef(0);
  const location = useLocation();

  const [indicator, setIndicator] = useState({ top: 0, height: 0, visible: false });
  const [ripples, setRipples] = useState([]);

  // Reposition the active-link indicator whenever the route changes.
  // Measures the real DOM position of whichever link React Router has
  // marked .active, rather than assuming a fixed layout/order.
  useLayoutEffect(() => {
    const activeEl = menuRef.current?.querySelector(".sidebar-link.active");
    if (activeEl && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const linkRect = activeEl.getBoundingClientRect();
      setIndicator({
        top: linkRect.top - menuRect.top,
        height: linkRect.height,
        visible: true,
      });
    } else {
      setIndicator((prev) => ({ ...prev, visible: false }));
    }
  }, [location.pathname, menuItems]);

  const handleRipple = (e, path) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++rippleId.current;
    setRipples((r) => [...r, { id, x, y, path }]);
    setTimeout(() => {
      setRipples((r) => r.filter((rp) => rp.id !== id));
    }, 500);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <MdBuild size={18} />
          </div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">VMR</div>
            <div className="sidebar-brand-sub">Garage Console</div>
          </div>
        </div>

        <div className="sidebar-menu" ref={menuRef}>
          <span
            className="sidebar-indicator"
            style={{
              transform: `translateY(${indicator.top}px)`,
              height: indicator.height,
              opacity: indicator.visible ? 1 : 0,
            }}
          />

          {menuItems.map((section, sectionIndex) => (
            <div
              key={section.title}
              className="sidebar-section sidebar-cascade"
              style={{ animationDelay: `${sectionIndex * 70}ms` }}
            >
              <h3>{section.title}</h3>

              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive ? "sidebar-link active" : "sidebar-link"
                  }
                  onClick={(e) => handleRipple(e, item.path)}
                >
                  {item.label}
                  {ripples
                    .filter((r) => r.path === item.path)
                    .map((r) => (
                      <span
                        key={r.id}
                        className="sidebar-ripple"
                        style={{ left: r.x, top: r.y }}
                      />
                    ))}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="logout-button" onClick={logout}>
          <span>Logout</span>
          <MdLogout size={22} />
        </button>

        <div className="user-row">
          <div className="user-avatar">
            <MdPerson size={22} />
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