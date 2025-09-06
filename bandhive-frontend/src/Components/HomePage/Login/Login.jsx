import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import "./Login.css";
import user_img from "../../../assets/person.png";
import pass_img from "../../../assets/password.png";
import admin_img from "../../../assets/Admin.png";
import band_img from "../../../assets/band.png";
import background_img from "../../../assets/login.jpg";


function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [selectedUser, setSelectedUser] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      setError("Please select a user type");
      return;
    }

    setLoading(true);
    setError("");

    console.log("Sending login request with data:", {
      username: formData.username,
      userType: selectedUser,
      password: formData.password ? "[PRESENT]" : "[MISSING]",
    });

    try {
      const response = await api.post("/jwt-login/", {
        username: formData.username,
        password: formData.password,
        userType: selectedUser,
      });

      console.log("Login response:", response.data);
      const { token, user, refresh } = response.data;

      localStorage.setItem("accessToken", token);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("userId", user.id);
      console.log("Stored userId in localStorage:", user.id);

      await login(user, token, refresh);

      const dashboardRoutes = {
        Admin: "/admin/dashboard",
        Band: "/band/dashboard",
        Customer: "/customer/dashboard",
      };

      const redirectTo =
        location.state?.from || dashboardRoutes[user.user_type] || "/";
      navigate(redirectTo, { replace: true, state: { refresh: true } });
    } catch (error) {
      console.error("Login error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      console.log("Raw error response:", error.response);

      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.error || "Unknown error";
        console.log("Error message received:", errorMessage);
        if (errorMessage === "Account not verified") {
          setError("Your account has not been verified by the admin yet. Please wait up to 5 hours or contact the admin.");
        } else {
          setError("Invalid username, password, or user type. Please check your credentials.");
        }
      } else if (error.response?.status === 403) {
        setError("User type doesn't match the account type. Please select the correct user type.");
      } else {
        setError(error.response?.data?.error || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = (userType) => {
    setSelectedUser(userType);
    setError("");
  };

  return (
    <div className="login-container" style={{ backgroundImage: `url(${background_img})` }} >  
      <div className="login-box">
        <div className="login-header">
          <h1>Login</h1>
          <p>Welcome back! Please log in to continue.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="music-notes">
          <span className="music-note">♪</span>
          <span className="music-note">♫</span>
          <span className="music-note">♩</span>
          <span className="music-note">♪</span>
          <span className="music-note">♫</span>
          <span className="music-note">♩</span>
          <span className="music-note">♪</span>
          <span className="music-note">♫</span>
          <span className="music-note">♩</span>
        </div>


        <form onSubmit={handleSubmit}>
          <div className="user-selection">
            <div className="user-title">Select User Type:</div>
            <div className="user-options">
              <div
                className={`user-option ${selectedUser === "Admin" ? "selected" : ""}`}
                onClick={() => handleUserSelection("Admin")}
              >
                <img src={admin_img} alt="Admin" />
                <span>Admin</span>
              </div>
              <div
                className={`user-option ${selectedUser === "Customer" ? "selected" : ""}`}
                onClick={() => handleUserSelection("Customer")}
              >
                <img src={user_img} alt="Customer" />
                <span>Customer</span>
              </div>
              <div
                className={`user-option ${selectedUser === "Band" ? "selected" : ""}`}
                onClick={() => handleUserSelection("Band")}
              >
                <img src={band_img} alt="Band" />
                <span>Band</span>
              </div>
            </div>
          </div>

          <div className="input-group-login">
            <div className="input-field">
              <img src={user_img} alt="Username" />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="input-field">
              <img src={pass_img} alt="Password" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="register-link">
            Not registered yet?{" "}
            <span onClick={() => navigate("/register-customer")}>Create an account</span>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;