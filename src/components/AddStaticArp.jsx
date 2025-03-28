import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

const AddStaticArp = () => {
  const [arpData, setArpData] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [ip, setIp] = useState("");
  const [mac, setMac] = useState("");
  const [interfaces, setInterfaces] = useState([]);
  const [ipError, setIpError] = useState("");

  useEffect(() => {
    // Disable scrolling when the component is mounted
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";
    
    // Enable scrolling when the component is unmounted
    return() => {
      document.body.style.overflowX = "auto"
      document.body.style.overflowY = "auto"
    }
  })

  const fetchArpData = async () => {
    try {
      const response = await fetch("/api2/arp");
      if (!response.ok) {
        throw new Error("Failed to fetch ARP data");
      }
      const data = await response.json();
      setArpData(data);
      setError(null); // Clear any previous error
    } catch (error) {
      setError("Failed to fetch ARP data.");
    }
  };

  const fetchInterfaces = async () => {
    try {
      const response = await fetch("/api2/interfaces");
      if (!response.ok) {
        throw new Error("Failed to fetch interfaces");
      }
      const data = await response.json();
      setInterfaces(data);
      setError(null); // Clear any previous error
    } catch (error) {
      setError("Failed to fetch interfaces. Backend might not be running.");
    }
  };

  const handleAddStaticArp = async () => {
    if (!isValidIp(ip)) {
      setIpError("Invalid IP address format.");
      return;
    }

    const arpEntry = { ip, mac };
    try {
      const response = await fetch("/api2/static", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arpEntry),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccessMessage("Static ARP entry added successfully!");
        setError(null);
        fetchArpData();
        setIp("");
        setMac("");
        setIpError("");

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setSuccessMessage(null);
        setError(result.error || "Failed to add ARP entry.");
      }
    } catch (error) {
      setSuccessMessage(null);
      setError(error.message);
    }
  };

  const isValidIp = (ipAddress) => {
    const segments = ipAddress.split(".");
    if (segments.length !== 4) return false;

    return segments.every((segment) => {
      if (!/^\d+$/.test(segment)) return false; // Check if segment is a number
      const num = parseInt(segment, 10);
      return num >= 0 && num <= 255 && (segment.length === 1 || !segment.startsWith("0"));
    });
  };

  useEffect(() => {
    fetchArpData();
    fetchInterfaces();
    const interval = setInterval(fetchArpData, 2000);
    return () => clearInterval(interval); // Clear the interval on cleanup
  }, []);

  const handleIpChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, ""); // Allow only numbers and dots
    setIp(value);
    if (isValidIp(value)) {
      setIpError(""); // Clear error if IP is valid
    } else {
      setIpError("Invalid IP address format."); // Set error message if invalid
    }
  };

  const formatMacForDisplay = (macAddress) => {
    return macAddress
      .replace(/[^a-fA-F0-9]/g, "")
      .slice(0, 12)
      .replace(/(.{2})(?=.)/g, "$1:");
  };

  const handleMacChange = (e) => {
    const rawMac = e.target.value.replace(/[^a-fA-F0-9]/g, "");
    setMac(rawMac);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      <SideMenu />
      <div className="flex-grow p-6 overflow-auto mr-4">
        <div className="bg-white p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-black text-3xl font-bold mb-4">ARP Table</h3>

          {/* Error Display */}
          {error && (
            <div className="text-red-600 font-semibold mb-4">
              Error: {error}
            </div>
          )}

          {/* Table Headings */}
          <div className="grid grid-cols-5 text-center font-bold mt-4 bg-gray-200 p-2 rounded-lg">
            <div> IP Address</div>
            <div> Hardware Type</div>
            <div> MAC Address</div>
            <div> Flags</div>
            <div> Interface</div>
          </div>

          {/* ARP Data */}
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

        {/* Form for Adding Static ARP Entry */}
        <div className="p-6 bg-white rounded-lg shadow-lg mt-6 mr-4">
          <h4 className="text-xl text-black font-bold mb-4">Add Static ARP</h4>

          {/* Success Message */}
          {successMessage && (
            <div className="text-green-500 text-sm mb-4">{successMessage}</div>
          )}
          {/* Error Display */}
          {error && (
            <div className="text-red-600 font-semibold mb-4">
              Error: {error}
            </div>
          )}

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

          <div className="flex items-center mb-4">
            <label className="text=left font-bold flex items-center justify-between">
              <span> MAC Address </span>
              <span> : </span>
            </label>
            <input
              type="text"
              value={formatMacForDisplay(mac)}
              onChange={handleMacChange}
              placeholder="e.g., AABBCCDDEEFF"
              className="bg-gray-100 ml-1 rounded-lg"
            />
          </div>

          <button
            onClick={handleAddStaticArp}
            className="bg-teal-400 text-white px-4 py-2 rounded-lg"
          >
            Add Static ARP
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStaticArp;
