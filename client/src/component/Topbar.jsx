import "./TopBar.css";

function Topbar({ title }) {
  return (
    <header className="topbar">
      <div className="logo-section">
        <h1>Garage Staff</h1>
      </div>

      <div className="title-section">
        <h1>{title}</h1>
      </div>

      <div className="button-section">
        <button>+ New Job</button>
      </div>
    </header>
  );
};

export default Topbar;