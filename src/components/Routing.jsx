import { useEffect, useState } from "react";
import Modal from "./Modal"; 
import { FaEdit, FaTimes } from "react-icons/fa";

function Routing() {
  const [networkInfo, setNetworkInfo] = useState({});
  const [selectedInterface, setSelectedInterface] = useState("");
  const [editedInterfaceName, setEditedInterfaceName] = useState(""); 
  const [ip, setIp] = useState("");
  const [subnet, setSubnet] = useState("");
  const [gateway, setGateway] = useState("");
  const [dns, setDns] = useState("");
  const [dhcpEnabled, setDhcpEnabled] = useState("DHCP");
  const [routes, setRoutes] = useState("");
  const [routeMetric, setRouteMetric] = useState("");
  const [routeTo, setRouteTo] = useState("");
  const [routeVia, setRouteVia] = useState("");
  const [isValidRoute, setIsValidRoute] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isViaValid, setIsViaValid] = useState(true);

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
  // validation for Routes entry
  const routePattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2})(,\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2})*$/;
  const handleRoute = (e) =>{
    const value = e.target.value;
    setRouteTo(value);

    //check if the input value matches the route pattern
    const isValid = routePattern.test(value);
    setIsValidRoute(isValid)
  }

  // validation for to entry
  const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const handleViaChange = (e) => {
    const value = e.target.value;
    setRouteVia(value);

    // Check if the IP address is 0.0.0.0 or a loopback address (127.x.x.x)
    if (value === "0.0.0.0" || value.startsWith("127.")) {
      setIsViaValid(false); // Set validity to false if it's a loopback or 0.0.0.0
    } else {
      // Validate IP address format
      setIsViaValid(ipPattern.test(value));
    }
  };

  const handleUpdate = async () => {
    if (dhcpEnabled === "Manual" && (!ip || !subnet)) {
      alert("IP Address and Subnet are mandatory fields!");
      return;
    }
  
    if (dhcpEnabled === "Manual" && ip && !ipPattern.test(ip)) {
      alert("Invalid IP Address format! Please enter a valid IP address.");
      return;
    }
  
    if (routeTo && !routePattern.test(routeTo)) {
      alert("Invalid routes format! Ensure each route follows the 'ip/subnet'.");
      return;
    }
  
    if ((routeVia && !routeTo) || (routeTo && !routeVia)) {
      alert("Both 'to' and 'via' must be provided together!");
      return;
    }
  
    // Get existing routes
    const existingRoutes = networkInfo[selectedInterface]?.Routes || [];
  
    // Identify routes to remove
    const removeRoutes = existingRoutes.filter(route => 
      route.to !== "default" // Remove everything except default
    );
  
    // Only add new routes if user provides input
    const addedRoutes = routeTo && routeVia ? [{ metric: routeMetric, to: routeTo, via: routeVia }] : [];
  
    // If user provides no route input, force clear existing routes
    const finalRoutes = addedRoutes.length > 0 ? addedRoutes : [];
  
    const payload = {
      interface: selectedInterface,
      new_interface_name: editedInterfaceName || selectedInterface,
      ip: dhcpEnabled === "DHCP" ? "" : ip,
      subnet: dhcpEnabled === "DHCP" ? "" : subnet,
      gateway: gateway || null,
      dns: dns ? dns.split(",").map((d) => d.trim()) : [],
      dhcp: dhcpEnabled === "DHCP",
      routes: finalRoutes,  // Ensure this overwrites old routes
      remove_routes: removeRoutes,
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
          setIsModalOpen(false);
          setSelectedInterface("");
//          window.location.reload();
        } else {
          alert(`Error updating network: ${data.message}`);
        }
      })
      .catch((error) => console.error("Error updating network:", error));
  };
  
  


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

      // If routes exist, parse the first route into its components
      if (selected["Routes"] && selected["Routes"].length > 0) {
        const firstRoute = selected["Routes"][0];
        setRouteMetric(firstRoute.metric || "");
        setRouteTo(firstRoute.to || "");
        setRouteVia(firstRoute.via || "");
      } else {
        setRouteMetric("");
        setRouteTo("");
        setRouteVia("");
      }
      // Format the routes into a comma-separated string (ip/subnet format)
      setRoutes(
        selected["Routes"]
          ? selected["Routes"]
              .map((route) => `${route.metric}, ${route.to}, ${route.via}`)
              .join(", ") // Combine the 'to' and 'via' properties
          : ""
      );
    }
    setIsModalOpen(true); // Open the modal
  };

  return (
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
              title={
                isEditable(iface)
                  ? "Edit Network Configuration"
                  : "Editing disabled for this interface"
              }
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
                  <span>Metric</span>
                  <span>:</span>
                </label>
                <input
                  type="number"
                  value={routeMetric}
                  onChange={(e) => setRouteMetric(e.target.value)}
                  placeholder="Enter metric"
                  className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                />
              </div>

              <div className="flex items-center mb-4">
                <label className="w-1/3 text-left font-bold flex items-center justify-between">
                  <span>to</span>
                  <span>:</span>
                </label>
                <input
                  type="text"
                  value={routeTo}
                  onChange={handleRoute}
                  placeholder="Enter routes in ip/subnet format, e.g., 192.168.1.0/24"
                  className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                />
                {
                !isValidRoute && (
                  <span className="text-red-500 text-md ml-2">Invalid route format</span>
                )
              }
              </div>
              
              <div className="flex items-center mb-4">
                <label className="w-1/3 text-left font-bold flex items-center justify-between">
                  <span>via</span>
                  <span>: </span>
                </label>
                <input
                  type="text"
                  value={routeVia}
                  onChange={handleViaChange}
                  placeholder="Enter Gateway"
                  className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                />
                {!isViaValid && (
                    <span className="text-red-500 text-md ml-2">Invalid via Address</span>
                  )}
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
  );
}

export default Routing;
