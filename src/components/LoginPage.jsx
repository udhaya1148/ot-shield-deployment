import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Extract IP address from URL
  const ip = window.location.hostname;  // Get IP address from the current URL

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api5/login", { username, password });
      if (response.data.success) {

        // Save credentials and IP in local storage
        localStorage.setItem("username", username);
        localStorage.setItem("password", password);
        localStorage.setItem("ip", ip); // Store the extracted IP address

        navigate("/home"); // Redirect to home page after successful login
      } else {
        setError(response.data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white shadow-md rounded-lg p-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Login
        </h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Login
        </button>
        {error && <p className="text-red-500 text-sm mt-4">Invalid Username or Password</p>}
      </form>
    </div>
  );
}

export default LoginPage;
