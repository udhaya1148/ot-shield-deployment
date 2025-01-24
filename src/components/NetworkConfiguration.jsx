import { useState, useEffect } from "react";
import SideMenu from "./SideMenu";
import IPAddress from "./IPAddress";
import Gateways from "./Gateways";
import Routing from "./Routing";

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
    { name: "Hostname" },
    { name: "Host Address" },
  ];

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div className="flex-1 flex flex-col bg-gray-100">
        <div className="flex bg-white shadow">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(tab.name)}
              className={`relative px-6 py-3 font-medium border-b-2 transition-all 
              ${activeTab === tab.name ? "border-blue-500 text-blue-600" : "border-transparent text-gray-600"}
              hover:text-blue-500`}
            >
              {tab.name}
              {activeTab === tab.name && (
                <span
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rotate-0"
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
          {activeTab === "Hostname" && <div>Content for Hostname</div>}
          {activeTab === "Host Address" && <div>Content for Host Address</div>}
        </div>
      </div>
    </div>
  );
}

export default NetworkConfiguration;
