import "./MessagePopup.css";

function MessagePopup({ message, onClose, isError = false }) {
  if (!message) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box message-popup-box">
        <h3 className={isError ? "message-popup-title-error" : "message-popup-title"}>
          {isError ? "Error" : "Success"}
        </h3>

        <p className="message-popup-text">{message}</p>

        <div className="modal-actions modal-actions-end">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MessagePopup;