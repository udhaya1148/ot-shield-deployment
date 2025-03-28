import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

const DeleteArp = () => {
  const [arpData, setArpData] = useState([]);
  const [interfaces, setInterfaces] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [ip, setIp] = useState("");
  const [ipError, setIpError] = useState(""); // Track IP error state

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

  // Function to fetch ARP data
  const fetchArpData = async () => {
    try {
      const response = await fetch(`/api2/arp`);
      if (!response.ok) {
        throw new Error("Failed to fetch ARP data");
      }
      const data = await response.json();
      setArpData(data);
    } catch (error) {
      console.error("Error fetching ARP data:", error);
      setError("Failed to load ARP data.");
    }
  };

  // Function to fetch available network interfaces for the dropdown
  const fetchInterfaces = async () => {
    try {
      const response = await fetch(`/api2/interfaces`);
      if (!response.ok) {
        throw new Error("Failed to fetch interfaces");
      }
      const data = await response.json();
      setInterfaces(data);
    } catch (error) {
      console.error("Error fetching interfaces:", error);
      setError("Failed to load interfaces.");
    }
  };

  // Function to validate IP address
  const isValidIp = (ipAddress) => {
    const regex =
      /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
    return regex.test(ipAddress);
  };

  // Function to handle deleting a static ARP entry
  const handleDeleteStaticArp = async () => {
    if (!isValidIp(ip)) {
      setIpError("Invalid IP address format.");
      return;
    }

    const arpEntry = { ip };
    try {
      const response = await fetch(`/api2/static`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arpEntry),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccessMessage("Static ARP entry deleted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000); // Clear message after 3 seconds
        fetchArpData(); // Refresh the ARP table after deleting entry
        setIp(""); // Clear input field
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // Handle IP address input
  const handleIpChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, ""); // Allow only numbers and dots
    setIp(value);
    if (isValidIp(value)) {
      setIpError(""); // Clear error if IP is valid
    }
  };

  useEffect(() => {
    fetchArpData();
    fetchInterfaces();
    const intervalId = setInterval(fetchArpData, 2000); // Refresh every 4 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-row h-screen w-screen bg-gray-100">
      <SideMenu />
      <div className="flex-grow p-6 overflow-auto mr-4">
        {/* Error Display */}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* Success Message Display */}
        {successMessage && (
          <div className="text-green-500 mb-4">{successMessage}</div>
        )}

        {/* ARP Table Display */}
        <div className=" p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-black text-3xl font-bold mb-4">ARP Table</h3>

          <div className="grid grid-cols-5 text-center font-bold mt-4 bg-gray-200 p-2 rounded-lg">
            <div> IP Address</div>
            <div> Hardware Type</div>
            <div> MAC Address</div>
            <div> Flags</div>
            <div> Interface</div>
          </div>
          {arpData?.length === 0 && (
            <div className="text-center text-gray-500 mt-4">
              No ARP entries found.
            </div>
          )}
          {arpData.map((entry, index) => (
            <div
              key={index}
              className="grid grid-cols-5 items-center text-center p-2 bg-gray-100 rounded-lg mt-2"
            >
              <div className="flex-1">{entry.ip}</div>
              <div className="flex-1">{entry.hw_type}</div>
              <div className="flex-1">{entry.mac}</div>
              <div className="flex-1">{entry.flags}</div>
              <div className="flex-1">{entry.iface}</div>
            </div>
          ))}
        </div>

        {/* Form for Deleting Static ARP Entry */}
        <div className="p-6 bg-white rounded-lg shadow-lg mr-4 mt-6">
          <h4 className="text-xl text-black font-bold mb-4">
            Delete Static ARP
          </h4>

          <div className="flex items-center mb-4">
            <label className="text-left font-bold flex items-center justify-between">
              <span>IP Address </span>
              <span> : </span>
            </label>
            <input
              type="text"
              value={ip}
              onChange={handleIpChange}
              placeholder="e.g., 192.168.0.1"
              className="bg-gray-100 px-4 ml-1 rounded-lg"
            />
            {ipError && <div className="text-red-500 text-sm">{ipError}</div>}
          </div>

          <button
            onClick={handleDeleteStaticArp}
            className="bg-teal-400 text-white rounded-lg p-2"
          >
            Delete ARP Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteArp;
