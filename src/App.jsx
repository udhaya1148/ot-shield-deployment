import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";

import MainDashboard from "./components/MainDashboard";
import NetworkConfiguration from "./components/NetworkConfiguration";
import ArpTable from "./components/ArpTable";
import AddStaticArp from "./components/AddStaticArp";
import DeleteArp from "./components/DeleteArp";
import RoutesTable from "./components/RoutesTable";
import Terminal from "./components/Terminal";
import LoginPage from "./components/LoginPage";

function Header() {
  const navigate = useNavigate(); // Hook for navigation

  const handleLogout = () => {
    // Handle any logout logic here, e.g., clearing session, tokens, etc.
    console.log("Logged out");
    // Redirect to the login page
    navigate("/");
  };

  return (
    <h1 className="font-bold text-3xl h-14 bg-gray-300 w-full p-2 flex items-center justify-between">
      <div className="flex items-center">
        <img
          src="https://chiefnet.io/wp-content/uploads/2022/08/Chiefnet-logo-5.svg"
          alt="ChiefNET"
          className="h-10 mr-2"
        />
        OT Shield
      </div>

      {/* Logout button positioned to the right */}
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </h1>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <div className="flex-grow">
          <Header />
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<MainDashboard />} />
            <Route path="/network-configuration" element={<NetworkConfiguration />} />
            <Route path="/arp" element={<ArpTable />} />
            <Route path="/add-arp" element={<AddStaticArp />} />
            <Route path="/delete-arp" element={<DeleteArp />} />
            <Route path="/routes" element={<RoutesTable />} />
            <Route path="/terminal" element={<Terminal />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
