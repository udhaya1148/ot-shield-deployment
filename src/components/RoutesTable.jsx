import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

function RoutesTable() {
  const [routes, setRoutes] = useState([]);
 ;

  const fetchNetworkInfo = () => {
    fetch("/api3/get-routes")
      .then((response) => response.json())
      .then((data) => setRoutes(data))
      .catch((error) => console.error("Error fetching routes:", error));
  };

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

 

  

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div className="flex-grow p-5 overflow-auto mt-4 justify-center">
        <div className="border border-black mb-2 p-3 bg-white rounded-lg shadow-lg">
         
            <div>
              <h3 className="text-2xl text-green-600 font-bold mt-6">
                Route Table
              </h3>
              <div className="flex items-center justify-between mt-4">
                <div className="font-bold flex-1">Metric</div>
                <div className="font-bold flex-1">Genmask</div>
                <div className="font-bold flex-1">Destination</div>
                <div className="font-bold flex-1">Gateway</div>
                <div className="font-bold flex-1">Interface</div>
                <div className="font-bold flex-1">Flags</div>
              </div>
              {routes.map((route, index) => (
                <div
                  key={index}
                  className="flex items-center border border-black justify-between bg-gray-100 p-2 mb-2 rounded-lg"
                >
                  <div className="flex-1">{route.Metric ?? "-"}</div>
                  <div className="flex-1">{route.Genmask ?? "-"}</div>
                  <div className="flex-1">{route.Destination ?? "-"}</div>
                  <div className="flex-1">{route.Gateway ?? "-"}</div>
                  <div className="flex-1">{route.Iface ?? "-"}</div>
                  <div className="flex-1">{route.Flags ?? "-"}</div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}

export default RoutesTable;
