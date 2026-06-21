import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../firebase/auth";

// Main login component that renders the login form and handles authentication,
// it checks the user's role after login and redirects them to the correct homepage
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

// Handles the form submission, triggers the Firebase login and redirects the user based on their role
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

// Attempts to log in with the provided credentials, redirects to the correct page on success,
// or shows an error message if the login fails or the role is unrecognised
    try {
      const role = await loginUser(email, password);

      if (role === "admin") navigate("/admin/home");
      else if (role === "customer") navigate("/customer/home");
      else throw new Error("Unknown role.");
    } catch (err) {
      if (err.message === "This account has been deactivated.") {
        setError("Your account has been deactivated. Please contact support for assistance.");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

// styling 
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div>
        <h1>Vehicle Maintenance</h1>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Email</label><br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <br />

          <div>
            <label>Password</label><br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <br />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}