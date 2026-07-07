import { overlayStyle, modalBoxStyle } from "../modalStyles";

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
    <div style={overlayStyle}>
      <div style={modalBoxStyle}>
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
 
          {error && <p style={{ color: "red" }}>{error}</p>}
 
          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>{" "}
          <button type="button" onClick={close}>Cancel</button>
        </form>
      </div>
    </div>
  );
}
 
export default SignUpModal;