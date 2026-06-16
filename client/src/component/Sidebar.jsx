import "./Sidebar.css";

const menuItems = [{
    title: 'Overview',
    items: [
        { name: "Dashboard", path: "/admin/home"},
        { name: "Notifications", path: "/admin/notifications"}
    ]
},
{
    title: "Workshop",
    items: [
        { name: "Jobs", path: "/admin/jobs"},
        { name: "Bookings", path: "/admin/bookings"},
        { name: "Tasks", path: "/admin/tasks"}
    ]
},
{
    title: "Records",
    items: [
        { name: "Customers", path: "/admin/customers"},
        { name: "Bar Chart", path: "/admin/barchart"},
        { name: "Pie Chart", path: "/admin/piechart"},
        { name: "Line Chart", path: "/admin/linechart"}
    ]
}
];

function Sidebar() {
  return (
    <aside className="sidebar">
        {menuItems.map((section) => (
            <div key={section.title} className="sidebar-section">
                <h3>{section.title}</h3>

                {section.items.map((item) => (
                    <a key={item.name} href={item.path}>
                        {item.name}
                    </a>
                ))}
            </div>
        ))}
    </aside>
  );
};

export default Sidebar;