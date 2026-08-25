import "./SignUpModal.css";
import "../FormControls.css";

function SignUpModal({ popup }) {
  const {
    show,
    firstName,
    lastName,
    email,
    phone,
    error,
    loading,
    setFirstName,
    setLastName,
    setEmail,
    setPhone,
    close,
    onSubmit,
  } = popup;

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Sign Up New Customer</h3>
        <form onSubmit={onSubmit}>
          <div>
            <label>First Name</label><br />
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>

          <div>
            <label>Last Name</label><br />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <div>
            <label>Email</label><br />
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label>Phone</label><br />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions modal-actions-end">
            <button type="button" className="btn btn-secondary" onClick={close}>
              Cancel
            </button>
            <button type="submit" className={`btn ${loading ? "btn-disabled" : "btn-primary"}`} disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUpModal;