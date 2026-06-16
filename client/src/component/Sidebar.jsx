import "./Sidebar.css";

const menuItems = [{
    title: 'Overview',
    items: [
        { name: "Dashboard", path: "/staff/home"},
        { name: "Notifications", path: "/staff/notifications"}
    ]
},
{
    title: "Workshop",
    items: [
        { name: "Jobs", path: "/staff/jobs"},
        { name: "Bookings", path: "/staff/bookings"},
        { name: "Tasks", path: "/staff/tasks"}
    ]
},
{
    title: "Records",
    items: [
        { name: "Customers", path: "/staff/customers"},
        { name: "Bar Chart", path: "/staff/barchart"},
        { name: "Pie Chart", path: "/staff/piechart"},
        { name: "Line Chart", path: "/staff/linechart"}
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