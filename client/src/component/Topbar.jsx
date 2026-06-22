import "./TopBar.css";

function Topbar({ title, logoText, buttonText }) {
  return (
    <header className="topbar">
      <div className="logo-section">
        <h1>{logoText}</h1>
      </div>

      <div className="title-section">
        <h1>{title}</h1>
      </div>

      {buttonText && (
        <div className="button-section">
          <button>{buttonText}</button>
        </div>
      )}
    </header>
  );
}

export default Topbar;