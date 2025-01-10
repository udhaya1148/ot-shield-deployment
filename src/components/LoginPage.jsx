import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Hook to handle navigation

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api5/login", { username, password });
      if (response.data.success) {
        alert("Login successful!");
        navigate("/home"); // Redirect to the home route
      } else {
        setError(response.data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <form onSubmit={handleLogin} style={{ width: "300px", textAlign: "center" }}>
        <h2>Login</h2>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ marginBottom: "10px", padding: "10px", width: "100%" }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: "10px", padding: "10px", width: "100%" }}
          />
        </div>
        <button type="submit" style={{ padding: "10px 20px", width: "100%" }}>Login</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}

export default LoginPage;
