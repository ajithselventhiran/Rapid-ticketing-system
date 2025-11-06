import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = "http://localhost:5000"; // Backend API

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password)
      return toast.warning("Please enter both username and password.");

    try {
      setLoading(true);
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const res = await axios.post(`${API}/api/login`, form);
      const { token, user } = res.data;
      if (!token || !user) throw new Error("Invalid login response");

      let contactInfo = {};
      try {
        const userRes = await axios.get(`${API}/api/employees/find`, {
          params: { key: user.username },
        });
        if (userRes.data?.email)
          contactInfo = {
            email: userRes.data.email,
            department: userRes.data.department,
          };
      } catch {
        console.warn("âš ï¸ Could not fetch contact info");
      }

      const fullUser = { ...user, ...contactInfo };
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(fullUser));

      toast.success("âœ… Login successful!", {
        autoClose: 1000,
        theme: "colored",
      });

      setTimeout(() => {
        if (user.role === "ADMIN") {
          navigate("/admin", { replace: true });
        } else if (user.role === "TECHNICIAN") {
          navigate("/technician", { replace: true });
        } else {
          setLoading(false);
          toast.error("User login not allowed.");
        }
      }, 1000);
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      toast.error(err.response?.data?.error || "�?O Login failed. Try again.");
    }
  };

  
  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{
        background: "linear-gradient(135deg, #1e3c72, #2a5298, #00b4ff)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Overlay Spinner */}
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 9999,
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            className="spinner-border text-info"
            style={{ width: "3rem", height: "3rem" }}
          ></div>
        </div>
      )}

      {/* Login Card */}
      <div
        className="p-4 shadow-lg"
        style={{
          width: "370px",
          borderRadius: "18px",
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#fff",
        }}
      >
        <h4
          className="text-center fw-bold mb-4"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            letterSpacing: "0.5px",
          }}
        >
          Rapid Ticketing System
        </h4>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-floating mb-3 position-relative">
            <input
              type="text"
              id="username"
              className="form-control text-light"
              placeholder="Enter Username"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "10px",
              }}
            />
            <label htmlFor="username" style={{ color: "#bbb" }}>
              <i className="bi bi-person-fill me-2"></i> Username
            </label>
          </div>

          {/* Password */}
          <div className="form-floating mb-4 position-relative">
            <input
              type="password"
              id="password"
              className="form-control text-light"
              placeholder="Enter Password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "10px",
              }}
            />
            <label htmlFor="password" style={{ color: "#bbb" }}>
              <i className="bi bi-lock-fill me-2"></i> Password
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="btn w-100 fw-bold"
            disabled={loading}
            style={{
              background: "linear-gradient(90deg, #00bfff, #009dff)",
              color: "#fff",
              borderRadius: "25px",
              padding: "10px 0",
              fontWeight: "600",
              border: "none",
              fontFamily: "'Montserrat', sans-serif",
              letterSpacing: "0.5px",
            }}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <ToastContainer />
      </div>
    </div>
  );
}
