import { useEffect, useState } from "react";
import Modal from "./Modal";
import { FaEdit, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

function HostnameDns() {
  const [networkInfo, setNetworkInfo] = useState({});
  const [selectedInterface, setSelectedInterface] = useState("");
  const [editedInterfaceName, setEditedInterfaceName] = useState("");
  const [ip, setIp] = useState("");
  const [subnet, setSubnet] = useState("");
  const [dns, setDns] = useState("");
  const [dhcpEnabled, setDhcpEnabled] = useState("DHCP");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hostname, setHostname] = useState("");
  const [newHostname, setNewHostname] = useState("");

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

  useEffect(() => {
    fetchHostname();
  }, []);

  const fetchNetworkInfo = () => {
    fetch(`/api1/network-info?ts=${new Date().getTime()}`)
      .then((response) => response.json())
      .then((data) => {
        setNetworkInfo(data.network_info);
      })
      .catch((error) => console.error("Error fetching network info:", error));
  };

  const fetchHostname = () => {
    fetch("/api6/hostname")
      .then((response) => response.json())
      .then((data) => setHostname(data.hostname))
      .catch((error) => console.error("Error fetching hostname:", error));
  };

  const handleUpdateHostname = () => {
    if (!newHostname.trim()) {
      alert("Hostname cannot be empty!");
      return;
    }
    fetch("/api6/update-hostname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostname: newHostname }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Hostname updated successfully!");
          setNewHostname("");
          fetchHostname();
        } else {
          alert(`Error: ${data.message}`);
        }
      })
      .catch((error) => console.error("Error updating hostname:", error));
  };

  const handleUpdate = () => {
    if (dhcpEnabled === "Manual" && (!ip || !subnet)) {
      alert("IP Address and Subnet are mandatory fields!");
      return;
    }

    const payload = {
      interface: selectedInterface,
      new_interface_name: editedInterfaceName || selectedInterface,
      ip: dhcpEnabled === "DHCP" ? "" : ip,
      subnet: dhcpEnabled === "DHCP" ? "" : subnet,
      dns: dns ? dns.split(",").map((d) => d.trim()) : [],
      dhcp: dhcpEnabled === "DHCP",
    };

    fetch("/api1/update-network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert("DNS updated successfully!");
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
    const selected = networkInfo[iface];

    if (!selected) {
      alert("Interface data not found.");
      return;
    }

    if (!isEditable(iface, selected)) {
      alert("This interface cannot be edited.");
      return;
    }
    setSelectedInterface(iface);
    setEditedInterfaceName(iface);

    if (selected) {
      setIp(selected["IP Address"] || "");
      setSubnet(selected["Subnet Mask"] || "");
      setDns(selected["DNS"] || "");
      setDhcpEnabled(selected["DHCP Status"] === "DHCP" ? "DHCP" : "Manual");
    }
    setIsModalOpen(true);
  };

  const handleDeleteDns = async (iface) => {
    if (!iface) {
      alert("No interface selected for DNS deletion.");
      return;
    }

    const selected = networkInfo[iface];

    const payload = {
      interface: iface,
      dns: null,
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
        alert("DNS removed successfully");
        fetchNetworkInfo();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to delete DNS:", error);
      alert("Failed to delete DNS");
    }
  };

  return (
    <div className="flex-grow p-6 overflow-auto mt-4 justify-center">
      <div className="border border-black mb-2 p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-3xl text-blue-600 font-bold">Configure DNS</h3>
        <div className="grid grid-cols-4 bg-gray-200 p-3 mt-2 font-bold text-center border-b border-black rounded-lg">
          <div>Interfaces</div>
          <div>DNS</div>
          <div>Edit</div>
          <div>Delete</div>
        </div>

        {Object.entries(networkInfo).map(([iface, info]) => {
          const editable = isEditable(iface, info);

          return (
            <div
              key={iface}
              className="grid grid-cols-4 items-center text-center border border-black bg-gray-100 p-2 mb-2 mt-2 rounded-lg"
            >
              <strong>{iface}</strong>
              <div>{info["DNS"] || "-"}</div>
              <div className="flex justify-center">
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
              </div>

              {/* Delete Button */}
              <div className="flex justify-center">
                  <button
                    onClick={() => handleDeleteDns(iface)}
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

      {/* Hostname Configuration Table */}
      <div className="border border-black p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-3xl text-blue-600 font-bold">Configure Hostname</h3>
        <div className="grid grid-cols-2 bg-gray-200 p-3 mt-2 font-bold text-center border-b border-black rounded-lg">
          <div>Current Hostname</div>
          <div>New Hostname</div>
        </div>
        <div className="grid grid-cols-2 items-center text-center border border-black bg-gray-100 p-2 mb-2 mt-2 rounded-lg">
          <strong>{hostname || "-"}</strong>
          <div className="flex items-center justify-center">
            <input
              type="text"
              value={newHostname}
              onChange={(e) => setNewHostname(e.target.value)}
              placeholder="Enter new hostname"
              className="h-[1.5rem] w-[16rem] bg-gray-200 outline-none px-4 ml-1 border border-black rounded-md"
            />
            <button
              onClick={handleUpdateHostname}
              className="ml-2 bg-blue-600 text-white p-2 rounded-md"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HostnameDns;
