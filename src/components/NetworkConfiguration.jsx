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
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div className="flex-1 flex flex-col bg-gray-100">
        <div className="flex bg-white shadow item-center rounded-lg mr-7 ml-7 mt-4">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(tab.name)}
              className={`relative px-6 py-3 font-medium border-b-2 transition-all 
              ${activeTab === tab.name ? "border-teal-400 text-teal-400" : "border-transparent text-black"}
              hover:text-teal-400`}
            >
              {tab.name}
              {activeTab === tab.name && (
                <span
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-teal-400 rotate-0"
                  style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
                ></span>
              )}
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
