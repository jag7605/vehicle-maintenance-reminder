function MessagePopup({ message, onClose, isError = false }) {
    if (!message) return null;
  
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div style={{ backgroundColor: "white", padding: "20px", minWidth: "320px", maxWidth: "480px", borderRadius: "6px" }}>
          <h3 style={{ color: isError ? "red" : "inherit", marginTop: 0 }}>
            {isError ? "Error" : "Success"}
          </h3>
  
          <p style={{ whiteSpace: "pre-line" }}>{message}</p>
  
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  export default MessagePopup;