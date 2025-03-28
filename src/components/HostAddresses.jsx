import { useEffect, useState } from "react";
import axios from "axios";

const HostAddresses = () => {
  const [hosts, setHosts] = useState([]);
  const [newHost, setNewHost] = useState({ ip: "", hostnames: "" });

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
    fetchHosts();
    //check update for every 5 sec
    const interval = setInterval(fetchHosts, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchHosts = async () => {
    try {
      const response = await axios.get("/api6/hosts");
      setHosts((prevHosts) => {
        //update state only chnage found
        if (JSON.stringify(prevHosts) !== JSON.stringify(response.data)) {
          return response.data;
        }
        return prevHosts;
      });
    } catch (error) {
      console.error("Error fetching hosts:", error);
    }
  };

  const addHost = async () => {
    if (newHost.ip && newHost.hostnames) {
      try {
        await axios.post("/api6/hosts", newHost);
        fetchHosts(); // Refresh the list
        setNewHost({ ip: "", hostnames: "" });
      } catch (error) {
        console.error("Error adding host:", error);
      }
    }
  };

  // const deleteHost = async (ip) => {
  //   try {
  //     await axios.delete(`/api6/hosts/${ip}`);
  //     fetchHosts(); // Refresh the list
  //   } catch (error) {
  //     console.error("Error deleting host:", error);
  //   }
  // };

  return (
    <div>
    <div className="max-w-4xl mx-auto mt-1 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-black">Host Addresses</h2>

      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 rounded-lg">IP Address</th>
            {/* <th className="border border-black px-4 py-2">Enabled?</th> */}
            <th className="px-4 py-2 rounded-lg">Hostnames</th>
            {/* <th className="border border-black px-4 py-2">Delete</th> */}
          </tr>
        </thead>

        <tbody>
          {hosts.map((host, index) => (
            <tr key={index} className="text-center">
              <td className="bg-gray-100 px-4 py-2 rounded-lg">{host.ip}</td>
              <td className="bg-gray-100 px-4 py-2 rounded-lg">{host.hostnames}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="max-w-4xl mx-auto p-4 bg-white mt-4 shadow-lg rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-black">
          Add New Host
        </h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="IP Address"
            value={newHost.ip}
            onChange={(e) => setNewHost({ ...newHost, ip: e.target.value })}
            className="bg-gray-100 px-3 py-2 rounded-lg w-1/3"
          />
          <input
            type="text"
            placeholder="Hostname"
            value={newHost.hostnames}
            onChange={(e) =>
              setNewHost({ ...newHost, hostnames: e.target.value })
            }
            className="bg-gray-100 px-3 py-2 rounded-lg w-1/2"
          />
          <button
            onClick={addHost}
            className="bg-teal-400 text-white px-4 py-2 rounded-lg"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostAddresses;
