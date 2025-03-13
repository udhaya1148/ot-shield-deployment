import { useEffect, useState } from "react";
import Modal from "./Modal";
import { FaEdit, FaTimes } from "react-icons/fa";
import { TiCancel } from "react-icons/ti";

function IPAddress() {
  const [networkInfo, setNetworkInfo] = useState({});
  const [selectedInterface, setSelectedInterface] = useState("");
  const [editedInterfaceName, setEditedInterfaceName] = useState(""); 
  const [ip, setIp] = useState("");
  const [subnet, setSubnet] = useState("");
  const [gateway, setGateway] = useState("");
  const [dns, setDns] = useState("");
  const [dhcpEnabled, setDhcpEnabled] = useState("DHCP");
  const [routes, setRoutes] = useState("");
  const [metric, setMetric] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); 

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

  const handleUpdate = () => {
    if (dhcpEnabled === "Manual" && (!ip || !subnet)) {
      alert("IP Address and Subnet are mandatory fields!");
      return;
    }

    const payload = {
      interface: selectedInterface,
      // new_interface_name: editedInterfaceName || selectedInterface, // Include the edited name
      ip: dhcpEnabled === "DHCP" ? "" : ip,
      subnet: dhcpEnabled === "DHCP" ? "" : subnet,
      gateway: gateway ? gateway : null,
      dns: dns ? dns.split(",").map((d) => d.trim()) : [],
      dhcp: dhcpEnabled === "DHCP",
      routes: [],
      metric: metric ? parseInt(metric, 10) : null,
    };

    // If routes are provided, parse them into the correct format
    if (routes) {
      payload.routes = routes.split(",").map((route) => {
        const [to, via] = route.trim().split(" ");
        return { to, via, metric: payload.metric || 100 };
      });
    }

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

  // F check if an interface is editable (blocking enp6s0f0 and similar names)
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
    <div className="flex-grow p-6 overflow-auto mt-4 justify-center">
      <div className="border border-black mb-2 p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-3xl text-blue-600 font-bold">
          Configure IP Address
        </h3>
        <div className="grid grid-cols-6 bg-gray-200 p-3 mt-2 font-bold text-center border-b border-black rounded-lg">
          <div>Interfaces</div>
          <div>Status</div>
          <div>Type</div>
          <div>IP Address</div>
          <div>Subnet</div>
          <div>Edit</div>
        </div>

        {Object.entries(networkInfo).map(([iface, info]) => (
          <div
            key={iface}
            className="grid grid-cols-6 mt-2 items-center text-center border border-black bg-gray-100 p-2 mb-2 rounded-lg"
          >
            <strong className="flex-1">{iface}</strong>
            <div className="flex-1">{info.Status}</div>
            <div className="flex-1">{info["DHCP Status"] || "-"}</div>
            <div className="flex-1">{info["IP Address"] || "-"}</div>
            <div className="flex-1">{info["Subnet Mask"] || "-"}</div>
            <div className="flex justify-center">
              <button
                onClick={() => handleInterfaceSelect(iface)}
                className="text-blue-500 hover:text-blue-700 "
                title={
                  isEditable(iface)
                    ? "Edit Network Configuration"
                    : "Editing disabled for this interface"
                }
                disabled={!isEditable(iface)}
              >
                {isEditable(iface) ? <FaEdit /> : <TiCancel className="text-red-500"/>}
              </button>
            </div>
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
              disabled
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
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="Enter IP Address"
                  className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                />
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

export default IPAddress;
