import { useEffect, useState } from "react";
import axios from "axios";

const HostAddresses = () => {
  const [hosts, setHosts] = useState([]);
  const [newHost, setNewHost] = useState({ ip: "", hostnames: "" });

  useEffect(() => {
    fetchHosts();
    //check update for every 5 sec
    const interval = setInterval(fetchHosts, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchHosts = async () => {
    try {
      const response = await axios.get("/api6/hosts");
      setHosts((prevHosts) =>{
        //update state only chnage found
        if (JSON.stringify(prevHosts) !== JSON.stringify(response.data)){
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

  const deleteHost = async (ip) => {
    try {
      await axios.delete(`/api6/hosts/${ip}`);
      fetchHosts(); // Refresh the list
    } catch (error) {
      console.error("Error deleting host:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-1 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Host Addresses</h2>

      <table className="w-full border-collapse border border-black">
        <thead>
          <tr className="bg-gray-100">
            <th className="bborder border-black px-4 py-2">IP Address</th>
            {/* <th className="border border-black px-4 py-2">Enabled?</th> */}
            <th className="border border-black px-4 py-2">Hostnames</th>
            <th className="border border-black px-4 py-2">Delete</th>
          </tr>
        </thead>
        <tbody>
          {hosts.map((host, index) => (
            <tr key={index} className="text-center">
              <td className="border border-black px-4 py-2">{host.ip}</td>
              {/* <td className="border border-black px-4 py-2">
                {host.enabled ? "Yes" : "No"}
              </td> */}
              <td className="border border-black px-4 py-2">{host.hostnames}</td>
              <td className="border border-black px-4 py-2">
                <button
                  onClick={() => deleteHost(host.ip)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 p-4 border border-black bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Add New Host</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="IP Address"
            value={newHost.ip}
            onChange={(e) => setNewHost({ ...newHost, ip: e.target.value })}
            className="border border-black px-3 py-2 rounded w-1/3"
          />
          <input
            type="text"
            placeholder="Hostname"
            value={newHost.hostnames}
            onChange={(e) => setNewHost({ ...newHost, hostnames: e.target.value })}
            className="border border-black px-3 py-2 rounded w-1/2"
          />
          <button
            onClick={addHost}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 "
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostAddresses;
