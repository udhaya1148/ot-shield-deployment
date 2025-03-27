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
import ProtectedRoute from "./components/ProtectedRoute";
import System from "./components/System";
import NetworkInterfacestate from "./components/NetworkInterfacestate";


function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.clear(); // Clears authentication state
    navigate("/");
  };  

  return (
    <h1 className="font-bold text-3xl h-14 bg-gray-100 w-screen p-2 flex items-center justify-between">
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
          className="text-black rounded-lg hover:bg-red-600 p-2 mr-5 p-2"
          title="Logout"
        >
          <IoMdLogOut size={25} />
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
            <Route
              path="/home"
              element={<ProtectedRoute element={<MainDashboard />} />}
            />
             <Route
              path="/arp"
              element={<ProtectedRoute element={<ArpTable />} />}
            />
            <Route
              path="/routes"
              element={<ProtectedRoute element={<RoutesTable />} />}
            />
            <Route
              path="/system"
              element={<ProtectedRoute element={<System />} />}
            />
            <Route
              path="/networkinterfacestate"
              element={<ProtectedRoute element={<NetworkInterfacestate />} />}
            />
            <Route
              path="/networkconfiguration"
              element={<ProtectedRoute element={<NetworkConfiguration />} />}
            />
            <Route
              path="/ip-address"
              element={<ProtectedRoute element={<IPAddress />} />}
            />
            <Route
              path="/gateway"
              element={<ProtectedRoute element={<Gateways />} />}
            />
            <Route
              path="/routing"
              element={<ProtectedRoute element={<Routing />} />}
            />
            <Route
              path="/addarp"
              element={<ProtectedRoute element={<AddStaticArp />} />}
            />
            <Route
              path="/deletearp"
              element={<ProtectedRoute element={<DeleteArp />} />}
            />
            <Route
              path="/terminal"
              element={<ProtectedRoute element={<Terminal />} />}
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
