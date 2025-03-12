import { useEffect, useState } from "react";
import Modal from "./Modal";
import { FaEdit, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { TiCancel } from "react-icons/ti";

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
  // const [isViaSameAsIp, setIsViaSameAsIp] = useState(false);

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
  const routePattern =
    /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2})(,\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2})*$/;
  const handleRoute = (e) => {
    const value = e.target.value;
    setRouteTo(value);

    //check if the input value matches the route pattern
    const isValid = routePattern.test(value);
    setIsValidRoute(isValid);
  };

  // validation for to entry
  const ipPattern =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const handleViaChange = (e) => {
    const value = e.target.value;
    setRouteVia(value);

    // chexk via is same as ip
    //if (value === ip) {
    //  setIsViaSameAsIp(true);
    //} else {
    //  setIsViaSameAsIp(false);
    //}

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
      alert(
        "Invalid routes format! Ensure each route follows the 'ip/subnet'."
      );
      return;
    }

    if ((routeVia && !routeTo) || (routeTo && !routeVia)) {
      alert("Both 'to' and 'via' must be provided together!");
      return;
    }

    // Get existing routes from the selected interface
    const existingRoutes = networkInfo[selectedInterface]?.Routes || [];

    // Remove extra "default" routes but keep only one
    const filteredExistingRoutes = [];
    let defaultRouteFound = false;

    existingRoutes.forEach((route) => {
      if (route.to === "default") {
        if (!defaultRouteFound) {
          filteredExistingRoutes.push(route);
          defaultRouteFound = true; // Keep only the first "default" route
        }
      } else {
        filteredExistingRoutes.push(route); // Keep non-default routes
      }
    });

    // If the user provides new route input, add it
    const addedRoutes =
      routeTo && routeVia
        ? [
            {
              metric: routeMetric ? Number(routeMetric) : 100,
              to: routeTo,
              via: routeVia,
            },
          ]
        : [];

    // Combine preserved routes and new routes
    const finalRoutes = [...filteredExistingRoutes, ...addedRoutes];

    // Check if changes are actually made
    const existingConfig = networkInfo[selectedInterface];
    if (
      existingConfig &&
      existingConfig.IP === ip &&
      existingConfig.Subnet === subnet &&
      existingConfig.Gateway === gateway &&
      JSON.stringify(existingConfig.Routes) === JSON.stringify(finalRoutes)
    ) {
      alert("No changes detected!");
      return; // Stop sending request if nothing changed
    }

    const payload = {
      interface: selectedInterface,
      ip: dhcpEnabled === "DHCP" ? "" : ip,
      subnet: dhcpEnabled === "DHCP" ? "" : subnet,
      gateway: gateway || null,
      dns: dns ? dns.split(",").map((d) => d.trim()) : [],
      dhcp: dhcpEnabled === "DHCP",
      routes: finalRoutes,
      remove_routes: [],
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
        } else {
          alert(`Error updating network: ${data.message}`);
        }
      })
      .catch((error) => console.error("Error updating network:", error));
  };

  const isEditable = (iface, info) => {
    // Ensure info is defined and "DHCP Status" exists
    if (!info || !info["DHCP Status"]) {
      return false;
    }

    // Allow editing if DHCP is "Manual"
    if (info["DHCP Status"] === "Manual") {
      return true;
    }

    // Block editing only if the interface name matches enp6s0fX and DHCP is "Enabled"
    return !(/^enp6s0f\d+$/.test(iface) && info["DHCP Status"] === "Enabled");
  };

  const handleInterfaceSelect = (iface) => {
    const selected = networkInfo[iface]; // Get the selected interface info

    if (!selected) {
      alert("Interface data not found.");
      return;
    }

    if (!isEditable(iface, selected)) {
      alert("This interface cannot be edited.");
      return;
    }

    setSelectedInterface(iface);
    setEditedInterfaceName(iface); // Prepopulate the edited name with the current interface name

    setIp(selected["IP Address"] || "");
    setSubnet(selected["Subnet Mask"] || "");
    setGateway(selected["Gateway"] || "");
    setDns(selected["DNS"] || "");
    setDhcpEnabled(selected["DHCP status"] === "DHCP" ? "DHCP" : "Manual");

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
            .filter((route) => route.to !== "default")
            .map((route) => `${route.metric}, ${route.to}, ${route.via}`)
            .join(", ")
        : ""
    );

    setIsModalOpen(true); // Open the modal
  };

  const handleDeleteRoutes = async (iface) => {
    if (!iface) {
      alert("No interface selected for gateway deletion.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the Route for ${iface}?`
    );
    if (!confirmDelete) return;

    const selected = networkInfo[iface];

    // Ensure we send IP and Subnet if DHCP is disabled
    const payload = {
      interface: iface,
      remove_static: true, // Only remove default route
    };

    if (selected && selected["DHCP Status"] !== "DHCP") {
      payload.ip = selected["IP Address"] || "";
      payload.subnet = selected["Subnet Mask"] || "";
    }

    try {
      const response = await fetch("/api1/update-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Route deleted successfully");
        fetchNetworkInfo(); // Refresh UI after deletion
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to delete routes:", error);
      alert("Failed to delete routes");
    }
  };

  return (
    <div className="flex-grow p-6 overflow-auto mt-4 justify-center">
      <div className="border border-black mb-2 p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-3xl text-blue-600 font-bold">Configure Routes</h3>

        <div className="grid grid-cols-7 bg-gray-200 p-3 mt-2 font-bold text-center border-b border-black rounded-lg">
          <div>Interfaces</div>
          <div>IP Address</div>
          <div>Subnet</div>
          <div>To</div>
          <div>Via</div>
          <div>Edit</div>
          <div>Delete</div>
        </div>

        {Object.entries(networkInfo).map(([iface, info]) => {
          // Get static routes (excluding "default" routes)
          const staticRoutes =
            info["Routes"]?.filter((route) => route.to !== "default") || [];
          const editable = isEditable(iface, info);
          const isDhcpEnabled = info["DHCP Status"] === "DHCP";

          return (
            <div
              key={iface}
              className="grid grid-cols-7 items-center text-center border border-black bg-gray-100 p-2 mb-2 mt-2 rounded-lg"
            >
              <strong>{iface}</strong>
              <div>{info["IP Address"] || "-"}</div>
              <div>
                {info.Status === "Up" ? info["Subnet Mask"] || "-" : "-"}
              </div>
              <div>{staticRoutes[0]?.to || "-"}</div>
              <div>{staticRoutes[0]?.via || "-"}</div>

              {/* Edit Button */}
              <div className="flex justify-center">
                {isDhcpEnabled ? (
                  <span className="text-gray-500 font-semibold">
                  <TiCancel
                    className="text-red-500"
                    title="DHCP Enabled"
                  />
                </span>
                ) : (
                  <button
                    onClick={() => handleInterfaceSelect(iface)}
                    className={`text-blue-500 hover:text-blue-700 ${
                      editable ? "" : "opacity-50 cursor-not-allowed"
                    }`}
                    title={
                      editable
                        ? "Edit Routes"
                        : "Editing disabled for this interface"
                    }
                    disabled={!editable}
                  >
                    <FaEdit />
                  </button>
                )}
              </div>

              {/* Delete Button */}
              <div className="flex justify-center">
                {isDhcpEnabled ? (
                  <span className="text-gray-500 font-semibold">
                    <TiCancel
                      className="text-red-500"
                      title="DHCP Enabled"
                    />
                  </span>
                ) : (
                  <button
                    onClick={() => handleDeleteRoutes(iface)}
                    className={`text-red-500 hover:text-red-700 ${
                      editable ? "" : "opacity-50 cursor-not-allowed"
                    }`}
                    title={
                      editable
                        ? "Delete Routes"
                        : "Deleting disabled for this interface"
                    }
                    disabled={!editable}
                  >
                    <MdDelete />
                  </button>
                )}
              </div>
            </div>
          );
        })}
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
                  placeholder="Enter To in ip/subnet format, e.g., 192.168.1.0/24"
                  className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                />
                {!isValidRoute && (
                  <span className="text-red-500 text-md ml-2">
                    Invalid route format
                  </span>
                )}
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
                  placeholder="Enter Via"
                  className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                />
                {!isViaValid && (
                  <span className="text-red-500 text-md ml-2">
                    Invalid via Address
                  </span>
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
