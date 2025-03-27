import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Disable scrolling when the component is mounted
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "hidden";

    // Enable scrolling when the component is unmounted
    return () => {
      document.body.style.overflowX = "auto";
      document.body.style.overflowY = "auto";
    };
  }, []);

  // Extract IP address from URL
  const ip = window.location.hostname;  // Get IP address from the current URL

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api5/login", { username, password }, { timeout: 5000 });
      if (response.data.success) {
        // Store authentication state in sessionStorage (instead of localStorage)
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("username", username);
        sessionStorage.setItem("password", password);
        sessionStorage.setItem("ip", ip);
  
        navigate("/home"); // Redirect to home page after successful login
      } else {
        setError(response.data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Invalid Username or Password.");
      console.error(err);
    }
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white shadow-md rounded-lg p-8"
      >
        <h2 className="text-2xl text-gray-600 mb-6 text-center font-semibold font-sans">
          Login
        </h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-100"
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-100"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-teal-400 text-white py-2 text-lg rounded-lg font-sans"
        >
          Login
        </button>
        {error && <p className="text-red-500 text-lg mt-4">{error}</p>}
      </form>
    </div>
  );
}

export default LoginPage;
