import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

const ArpTable = () => {
  const [arpData, setArpData] = useState([]);
  const [error, setError] = useState(null);

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
      const response = await fetch("/api2/arp");
      if (!response.ok) {
        throw new Error(`Failed to fetch ARP data: ${response.statusText}`);
      }
      const data = await response.json();

      // Ensure data is an array before setting state
      if (Array.isArray(data)) {
        setArpData(data);
        setError(null);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (err) {
      setError(err.message);
      setArpData([]);
    }
  };

  // useEffect for periodic data fetching
  useEffect(() => {
    fetchArpData();
    const interval = setInterval(fetchArpData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="flex h-screen w-screen mt=10 bg-gray-100">
      <SideMenu />
      <div className="flex-grow p-6 overflow-auto bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md mr-4">
          <h3 className="text-black text-3xl font-bold mb-4">ARP Table</h3>

          {/* Error Display */}
          {error && (
            <div className="text-red-600 font-semibold mb-4">
              Error: {error}
            </div>
          )}

          {/* Table Headings */}
          <div className="grid grid-cols-5 text-center justify-between mt-4 bg-gray-200 p-2 rounded-lg">
            <div>IP Address</div>
            <div>Hardware Type</div>
            <div>MAC Address</div>
            <div>Flags</div>
            <div>Interface</div>
          </div>

          {/* Display ARP Data */}
          {arpData.length > 0 ? (
            <div className="divide-y divide-gray-300">
              {arpData.map((entry, index) => (
                <div
                  key={index}
                  className="grid grid-cols-5 text-center items-center justify-between p-2 bg-gray-100  rounded-lg mt-2"
                >
                  <div className="flex-1">{entry.ip}</div>
                  <div className="flex-1">{entry.hw_type}</div>
                  <div className="flex-1">{entry.mac}</div>
                  <div className="flex-1">{entry.flags}</div>
                  <div className="flex-1">{entry.iface}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 mt-4">No ARP data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArpTable;
