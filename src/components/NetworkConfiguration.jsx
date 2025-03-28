import { useState, useEffect } from "react";
import SideMenu from "./SideMenu";
import IPAddress from "./IPAddress";
import Gateways from "./Gateways";
import Routing from "./Routing";
import HostnameDns from "./HostnameDns";
import HostAddresses from "./HostAddresses";

function NetworkConfiguration() {
  const [activeTab, setActiveTab] = useState("Network Interface");

  useEffect(() => {
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";

    return () => {
      document.body.style.overflowX = "auto";
      document.body.style.overflowY = "auto";
    };
  }, []);

  const tabs = [
    { name: "Network Interface" },
    { name: "Gateway" },
    { name: "Routing" },
    { name: "Hostname and DNS" },
    { name: "Host Address" },
  ];

  return (
    <div className="flex flex-row min-h-screen w-screen bg-gray-100">
      <SideMenu />
      <div className="flex-1 flex flex-col bg-gray-100">
        <div className="flex bg-white shadow items-center rounded-lg mr-7 ml-7 mt-4">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(tab.name)}
              className={`relative px-6 py-3 font-medium transition-all w-full text-center
              ${
                activeTab === tab.name
                  ? "bg-teal-400 text-white rounded-lg"
                  : "text-black hover:text-teal-400"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <div className="flex-1 p-1">
          {activeTab === "Network Interface" && <IPAddress />}
          {activeTab === "Gateway" && <Gateways />}
          {activeTab === "Routing" && <Routing />}
          {activeTab === "Hostname and DNS" && <HostnameDns />}
          {activeTab === "Host Address" && <HostAddresses />}
        </div>
      </div>
    </div>
  );
}

export default NetworkConfiguration;
