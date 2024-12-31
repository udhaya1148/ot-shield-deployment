import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

function MainDashboard() {
  const [grafanaUrl, setGrafanaUrl] = useState("");

  useEffect(() => {
    // Fetch the dynamically detected Grafana URL from the backend
    const fetchGrafanaIp = async () => {
      try {
        const response = await fetch("/api/grafana-ip");
        if (response.ok) {
          const data = await response.json();
          setGrafanaUrl(data.grafana_ip);
        } else {
          console.error("Failed to fetch Grafana IP");
        }
      } catch (error) {
        console.error("Error fetching Grafana IP:", error);
      }
    };

    fetchGrafanaIp();
  }, []);

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div className="flex-grow p-1 overflow-auto justify-center">
        {grafanaUrl ? (
          <iframe
            src={grafanaUrl}
            frameBorder="0"
            title="Dashboard"
            className="w-full h-full"
          ></iframe>
        ) : (
          <p>Loading Grafana dashboard...</p>
        )}
      </div>
    </div>
  );
}

export default MainDashboard;
