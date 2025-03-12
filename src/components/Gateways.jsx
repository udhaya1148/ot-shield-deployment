import { useEffect, useState } from "react";
import Modal from "./Modal";
import { FaEdit, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

function Gateways() {
  const [networkInfo, setNetworkInfo] = useState({});
  const [selectedInterface, setSelectedInterface] = useState("");
  const [editedInterfaceName, setEditedInterfaceName] = useState("");
  const [ip, setIp] = useState("");
  const [subnet, setSubnet] = useState("");
  const [gateway, setGateway] = useState("");
  const [dhcpEnabled, setDhcpEnabled] = useState("DHCP");
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatewayValid, setIsGatewayValid] = useState(true);
  const [isGatewaySameAsIp, setIsGatewaySameAsIp] = useState(false);

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

  const ipPattern =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const handleGatewayChange = (e) => {
    const value = e.target.value;
    setGateway(value);

    //vialidate Gateway is same as IP
    if (value === ip) {
      setIsGatewaySameAsIp(true);
    } else {
      setIsGatewaySameAsIp(false);
    }

    // Check if the IP address is 0.0.0.0 or a loopback address (127.x.x.x)
    if (value === "0.0.0.0" || value.startsWith("127.")) {
      setIsGatewayValid(false); // Set validity to false if it's a loopback or 0.0.0.0
    } else {
      // Validate IP address format
      setIsGatewayValid(ipPattern.test(value));
    }
  };

  const handleUpdate = () => {
    // Extract routes from networkInfo for the selected interface
    const routes = networkInfo[selectedInterface]?.routes || [];
    // Validate Gateway address entry
    if (dhcpEnabled === "Manual" && gateway && !ipPattern.test(gateway)) {
      alert(
        "Invalid Gateway Address format! Please enter a valid Gateway address."
      );
      return;
    }

    const removeDefault = routes.length === 0 && !gateway;

    const payload = {
      interface: selectedInterface,
      new_interface_name: editedInterfaceName || selectedInterface,
      ip: dhcpEnabled === "DHCP" ? "" : ip,
      subnet: dhcpEnabled === "DHCP" ? "" : subnet,
      gateway: gateway ? gateway : null,
      dhcp: dhcpEnabled === "DHCP",
      routes: [], 
      remove_default: removeDefault,
    };

    // Add default route if gateway is provided
    if (gateway) {
      payload.routes.push({ to: "default", via: gateway, metric: 100 });
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
          setIsModalOpen(false); 
          setSelectedInterface("");
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
      setDhcpEnabled(selected["DHCP Status"] === "DHCP" ? "DHCP" : "Manual");
    }
    setIsModalOpen(true); 
  };
  // Delete gateway

  const handleDeleteDefaultGateway = async (iface) => {
    if (!iface) {
      alert("No interface selected for gateway deletion.");
      return;
    }

    const selected = networkInfo[iface];

    // Ensure we send IP and Subnet if DHCP is disabled
    const payload = {
      interface: iface,
      remove_default: true, // Only remove default route
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
        alert("Default route deleted successfully");
        fetchNetworkInfo(); 
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to delete default gateway:", error);
      alert("Failed to delete default gateway");
    }
  };

  return (
    <div className="flex-grow p-6 overflow-auto mt-4 justify-center">
      <div className="border border-black mb-2 p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-3xl text-blue-600 font-bold">Configure Gateway</h3>

        <div className="grid grid-cols-6 bg-gray-200 p-3 mt-2 font-bold text-center border-b border-black rounded-lg">
          <div>Interfaces</div>
          <div>IP Address</div>
          <div>Subnet</div>
          <div>Gateway</div>
          <div>Edit</div>
          <div>Delete</div>
        </div>

        {Object.entries(networkInfo).map(([iface, info]) => (
          <div
            key={iface}
            className="grid grid-cols-6 items-center text-center border border-black bg-gray-100 p-2 mb-2 mt-2 rounded-lg"
          >
            <strong>{iface}</strong>
            <div>{info["IP Address"] || "-"}</div>
            <div>{info.Status === "Up" ? info["Subnet Mask"] || "-" : "-"}</div>
            <div>{info.Status === "Up" ? info["Gateway"] || "-" : "-"}</div>

            <div className="flex justify-center">
              <button
                onClick={() => handleInterfaceSelect(iface)}
                className={`text-blue-500 hover:text-blue-700 ${
                  isEditable(iface) ? "" : "opacity-50 cursor-not-allowed"
                }`}
                title={
                  isEditable(iface)
                    ? "Edit Gateway"
                    : "Editing disabled for this interface"
                }
                disabled={!isEditable(iface)}
              >
                <FaEdit />
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => handleDeleteDefaultGateway(iface)}
                className={`text-red-500 hover:text-red-700 ${
                  isEditable(iface) ? "" : "opacity-50 cursor-not-allowed"
                }`}
                title={
                  isEditable(iface)
                    ? "Delete Gateway"
                    : "Deleting disabled for this interface"
                }
                disabled={!isEditable(iface)}
              >
                <MdDelete />
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
              onChange={(e) => setEditedInterfaceName(e.target.value)}
              placeholder="Enter new interface name"
              className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
            />
          </div>
          {/* DHCP/Manual Selection */}
          {/* Only show these fields if DHCP is not enabled */}
          {dhcpEnabled === "Manual" && (
            <>
              <div className="flex items-center mb-4">
                <label className="w-1/3 text-left font-bold flex items-center justify-between">
                  <span>Default Gateway</span>
                  <span>: </span>
                </label>
                <input
                  type="text"
                  value={gateway}
                  onChange={handleGatewayChange}
                  placeholder="Enter Default Gateway"
                  className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
                />
                {isGatewaySameAsIp && (
                  <span className="text-red-500 text-md ml-2">
                    Gateway is same as Interface IP
                  </span>
                )}
                {!isGatewayValid && (
                  <span className="text-red-500 text-xs ml-2">
                    Invalid Gateway Address
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

export default Gateways;
