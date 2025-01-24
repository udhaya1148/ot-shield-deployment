import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import MainDashboard from "./components/MainDashboard";
import NetworkConfiguration from "./components/NetworkConfiguration";
import ArpTable from "./components/ArpTable";
import AddStaticArp from "./components/AddStaticArp";
import DeleteArp from "./components/DeleteArp";
import RoutesTable from "./components/RoutesTable";
import Terminal from "./components/Terminal";
import LoginPage from "./components/LoginPage";
import { IoMdLogOut } from "react-icons/io";
import IPAddress from "./components/IPAddress";
import Routing from "./components/Routing";
import Gateways from "./components/Gateways";

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <h1 className="font-bold text-3xl h-14 bg-gray-300 w-screen p-2 flex items-center justify-between">
      <div className="flex items-center">
        <img
          src="https://chiefnet.io/wp-content/uploads/2022/08/Chiefnet-logo-5.svg"
          alt="ChiefNET"
          className="h-10 mr-2"
        />
        OT Shield
      </div>

      {location.pathname !== "/" && (
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white rounded-md hover:bg-red-600 p-2 mr-4 p-2"
          title="Logout"
        >
          <IoMdLogOut size={20} />
        </button>
      )}
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
            <Route
              path="/ip-address"
              element={<IPAddress />}
            />
            <Route
              path="/gateway"
              element={<Gateways />}
            />
            <Route
              path="/routing"
              element={<Routing />}
            />
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
