import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../firebase/auth";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdLogin } from "react-icons/md";
import "./LoginPage.css";

// Main login component that renders the login form and handles authentication,
// it checks the user's role after login and redirects them to the correct homepage
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const majorTicks = [-120, -90, -60, -30, 0, 30, 60, 90, 120];
  const redlineTicks = [90, 120];

// styling
  return (
    <div className="login-page-wrapper">
      <div className="login-hero">
        <div className="login-glow" />

        <svg
          className="login-gauge"
          width="220"
          height="220"
          viewBox="0 0 320 320"
          role="img"
          aria-label="Illustrated tachometer needle sweeping up and settling"
        >
          <circle cx="160" cy="160" r="132" fill="none" stroke="var(--color-sidebar-border)" strokeWidth="2" />
          {majorTicks.map((angle) => {
            const isRedline = redlineTicks.includes(angle);
            return (
              <line
                key={angle}
                x1="160"
                y1="34"
                x2="160"
                y2="54"
                stroke={isRedline ? "var(--color-error)" : "var(--color-sidebar-border)"}
                strokeWidth={isRedline ? 4 : 3}
                strokeLinecap="round"
                transform={`rotate(${angle} 160 160)`}
              />
            );
          })}
          <circle cx="160" cy="160" r="6" fill="var(--color-accent)" />
          <g className="login-needle">
            <line x1="160" y1="160" x2="160" y2="52" stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round" />
          </g>
          <circle cx="160" cy="160" r="3" fill="var(--color-sidebar-bg)" />
        </svg>

        <div className="login-wordmark">
          <span>V</span>
          <span>M</span>
          <span>R</span>
        </div>

        <p className="login-tagline">
          Bookings, reminders and service history for every vehicle, in one place.
        </p>

        <div className="login-stats-row">
          <span>WOF TRACKING</span>
          <span className="login-dot" />
          <span>OIL CHANGE ALERTS</span>
          <span className="login-dot" />
          <span>NZ GARAGES</span>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-card">
          <div className="login-eyebrow">SERVICE ACCOUNT</div>
          <h1 className="login-title">Sign in to your garage</h1>
          <p className="login-subtext">Enter your details to view bookings, vehicles and reminders.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-field">
              <label className="form-label">Email</label>
              <div className="input-row">
                <MdEmail className="input-icon" />
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-form-field">
              <label className="form-label">Password</label>
              <div className="input-row">
                <MdLock className="input-icon" />
                <input
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="login-submit" disabled={loading}>
              <MdLogin />
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}