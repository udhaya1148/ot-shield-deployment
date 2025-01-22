import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

import Modal from "./Modal"; // Import the Modal component
import { FaEdit, FaTimes } from "react-icons/fa";

function NetworkConfiguration() {
  const [networkInfo, setNetworkInfo] = useState({});
  const [selectedInterface, setSelectedInterface] = useState("");
  const [editedInterfaceName, setEditedInterfaceName] = useState(""); // State for editing interface name
  const [ip, setIp] = useState("");
  const [subnet, setSubnet] = useState("");
  const [gateway, setGateway] = useState("");
  const [dns, setDns] = useState("");
  const [dhcpEnabled, setDhcpEnabled] = useState("DHCP");
  const [routes, setRoutes] = useState("");
  const [metric, setMetric] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [isIpValid, setIsIpValid] = useState(true);
  const [isValidRoute, setIsValidRoute] = useState(true);

  useEffect(() => {
    // Disable scrolling when the component is mounted
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";

    // Enable scrolling when the component is unmounted
    return () => {
      document.body.style.overflowX = "auto";
      document.body.style.overflowY = "auto";

    };
  }, []);

  useEffect(() => {
    fetchNetworkInfo();
    const interval = setInterval(fetchNetworkInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchNetworkInfo = () => {
    fetch(`/api1/network-info?ts=${new Date().getTime()}`)
      .then((response) => response.json())
      .then((data) => {
        setNetworkInfo(data.network_info);
      })
      .catch((error) => console.error("Error fetching network info:", error));
  };

  const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  const routePattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2})(,\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2})*$/;
  const handleUpdate = () => {
    if (dhcpEnabled === "Manual" && (!ip || !subnet)) {
      alert("IP Address and Subnet are mandatory fields!");
      return;
    }
  
    // Validate IP address format
    if (dhcpEnabled === "Manual" && ip && !ipPattern.test(ip)) {
      alert("Invalid IP Address format! Please enter a valid IPv4 address.");
      return;
    }

    // Validate gateway and routes
    if ((gateway && !routes) || (routes && !gateway)) {
      alert("Gateway and Routes must be provided together!");
      return;
    }
  
    // Validate routes format
    if (routes && !routePattern.test(routes)) {
      alert(
        "Invalid routes format! Ensure each route follows the 'ip/subnet' format, e.g. 192.168.1.0/24"
      );
      return;
    }
  
    const payload = {
      interface: selectedInterface,
      new_interface_name: editedInterfaceName || selectedInterface, // Include the edited name
      ip: dhcpEnabled === "DHCP" ? "" : ip,
      subnet: dhcpEnabled === "DHCP" ? "" : subnet,
      gateway: gateway ? gateway : null,
      dns: dns ? dns.split(",").map((d) => d.trim()) : [],
      dhcp: dhcpEnabled === "DHCP",
      routes: routes ? routes.split(",").map((route) => route.trim()) : [],
      metric: metric ? parseInt(metric, 10) : null,
    };
  
    fetch("/api1/update-network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Network updated successfully!");
          fetchNetworkInfo();
          setIsModalOpen(false); // Close the modal
          setSelectedInterface("");
          window.location.reload();
        } else {
          alert(`Error updating network: ${data.message}`);
        }
      })
      .catch((error) => console.error("Error updating network:", error));
  };

  const handleIpChange = (e) => {
    const value = e.target.value;
    setIp(value);

    // Check if the IP address is 0.0.0.0 or a loopback address (127.x.x.x)
    if (value === "0.0.0.0" || value.startsWith("127.")) {
      setIsIpValid(false); // Set validity to false if it's a loopback or 0.0.0.0
    } else {
      // Validate IP address format
      setIsIpValid(ipPattern.test(value));
    }
  };

  const handleRoute = (e) => {
    const value = e.target.value;
    setRoutes(value);

    // Check if the input value matches the route pattern
    const isValid = routePattern.test(value);
    setIsValidRoute(isValid); // Update validity state
  }
  
  // Function to check if an interface is editable (blocking enp6s0f0 and similar names)
  const isEditable = (iface) => {
    // Block editing if the interface name matches enp6s0f0 pattern
    return !/^enp6s0f\d+$/.test(iface);
  };

  const handleInterfaceSelect = (iface) => {
    if (!isEditable(iface)) {
      alert("This interface cannot be edited.");
      return;
    }
    setSelectedInterface(iface);
    setEditedInterfaceName(iface); // Prepopulate the edited name with the current interface name
    const selected = networkInfo[iface];
    if (selected) {
      setIp(selected["IP Address"] || "");
      setSubnet(selected["Subnet Mask"] || "");
      setGateway(selected["Gateway"] || "");
      setDns(selected["DNS"] || "");
      setDhcpEnabled(selected["DHCP Status"] === "DHCP" ? "DHCP" : "Manual");

      // Format the routes into a comma-separated string (ip/subnet format)
      setRoutes(
        selected["Routes"]
          ? selected["Routes"]
              .map((route) => `${route.to}`) // Format each route
              .join(", ") // Join them with a comma
          : ""
      );

      setMetric(selected["Metric"] || ""); // Set the metric value
    }
    setIsModalOpen(true); // Open the modal
  };

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div className="flex-grow p-6 overflow-auto mt-4 justify-center">
        <div className="border border-black mb-2 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-3xl text-blue-600 font-bold">
            Available Interfaces
          </h3>
          <div className="flex items-center justify-between mt-4">
            <div className="font-bold flex-1">Interfaces</div>
            <div className="font-bold flex-1">Status</div>
            <div className="font-bold flex-1">Type</div>
            <div className="font-bold flex-1">IP Address</div>
            <div className="font-bold flex-1">Subnet</div>
            <div className="font-bold flex-1">Gateway</div>
            <div className="font-bold flex-1">DNS</div>
            <div className="font-bold items-center justify-end">Edit</div>
          </div>
          {Object.entries(networkInfo).map(([iface, info]) => (
            <div
              key={iface}
              className="flex items-center border border-black justify-between bg-gray-100 p-2 mb-2 rounded-lg"
            >
              <strong className="flex-1">{iface}</strong>
              <div className="flex-1">{info.Status}</div>
              <div className="flex-1">{info["DHCP Status"] || "-"}</div>
              <div className="flex-1">{info["IP Address"] || "-"}</div>
              <div className="flex-1">
                {info.Status === "Up" ? info["Subnet Mask"] || "-" : "-"}
              </div>
              <div className="flex-1">
                {info.Status === "Up" ? info["Gateway"] || "-" : "-"}
              </div>
              <div className="flex-1">
                {info.Status === "Up" ? info["DNS"] || "-" : "-"}
              </div>
              <button
                onClick={() => handleInterfaceSelect(iface)}
                className={`text-blue-500 hover:text-blue-700 ${
                  isEditable(iface) ? "" : "opacity-50 cursor-not-allowed"
                }`}
                title={isEditable(iface) ? "Edit Network Configuration" : "Editing disabled for this interface"}
                disabled={!isEditable(iface)}
              >
                <FaEdit />
              </button>
            </div>
          ))}
        </div>

        {/* Modal for editing network configuration */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="border border-gray-500 p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-xl text-gray-600 hover:text-gray-900"
              title="Close Modal"
            >
              <FaTimes />
            </button>
            <div className="flex items-center mb-4">
              <label className="w-1/3 text-left font-bold flex items-center justify-between">
                <span>Interface Name</span>
                <span>:</span>
              </label>
              <input
                type="text"
                value={editedInterfaceName}
                onChange={(e) => setEditedInterfaceName(e.target.value)}
                placeholder="Enter new interface name"
                className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
              />
            </div>
            {/* DHCP/Manual Selection */}
            <div className="flex items-center mb-4">
              <label className="w-1/3 text-left font-bold flex items-center justify-between">
                <span>DHCP/Manual</span>
                <span>:</span>
              </label>
              <select
                value={dhcpEnabled}
                onChange={(e) => setDhcpEnabled(e.target.value)}
                className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
              >
                <option value="DHCP">DHCP</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
            {/* Only show these fields if DHCP is not enabled */}
            {dhcpEnabled === "Manual" && (
              <>
                <div className="flex items-center mb-4">
                  <label className="w-1/3 text-left font-bold flex items-center justify-between">
                    <span>IP Address</span>
                    <span>:</span>
                  </label>
                  <input
                    type="text"
                    value={ip}
                    onChange={handleIpChange}
                    placeholder="Enter IP Address"
                    className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                  />
                  {!isIpValid && (
                    <span className="text-red-500 text-xs ml-2">Invalid IP Address</span>
                  )}
                </div>

                <div className="flex items-center mb-4">
                  <label className="w-1/3 text-left font-bold flex items-center justify-between">
                    <span>Subnet Mask / CIDR</span>
                    <span>:</span>
                  </label>
                  <input
                    type="text"
                    value={subnet}
                    onChange={(e) => setSubnet(e.target.value)}
                    placeholder="Enter Subnet Mask or CIDR"
                    className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                  />
                </div>

                <div className="flex items-center mb-4">
                  <label className="w-1/3 text-left font-bold flex items-center justify-between">
                    <span>Metric</span>
                    <span>:</span>
                  </label>
                  <input
                    type="number"
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    placeholder="Enter metric"
                    className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                  />
                </div>

                <div className="flex items-center mb-4">
                  <label className="w-1/3 text-left font-bold flex items-center justify-between">
                    <span>Route (ip/subnet format)</span>
                    <span>:</span>
                  </label>
                  <input
                    type="text"
                    value={routes}
                    onChange={handleRoute}
                    placeholder="Enter routes in ip/subnet format, e.g., 192.168.1.0/24"
                    className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                  />
                  {!isValidRoute && (
                    <span className="text-red-500 text-xs ml-2">Invalid route format</span>
                  )}
                </div>

                <div className="flex items-center mb-4">
                  <label className="w-1/3 text-left font-bold flex items-center justify-between">
                    <span>Gateway</span>
                    <span>: </span>
                  </label>
                  <input
                    type="text"
                    value={gateway}
                    onChange={(e) => setGateway(e.target.value)}
                    placeholder="Enter Gateway"
                    className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                  />
                </div>

                <div className="flex items-center mb-4">
                  <label className="w-1/3 text-left font-bold flex items-center justify-between">
                    <span>DNS (comma separated)</span>
                    <span>: </span>
                  </label>
                  <input
                    type="text"
                    value={dns}
                    onChange={(e) => setDns(e.target.value)}
                    placeholder="Enter DNS (optional)"
                    className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                  />
                </div>
              </>
            )}
            <button
              onClick={handleUpdate}
              className="bg-blue-600 text-white p-2 rounded-md mt-4"
            >
              Update
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default NetworkConfiguration;
