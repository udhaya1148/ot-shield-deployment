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
    <div className="flex flex-row h-screen w-screen bg-gray-100">
      <SideMenu />
      <div className="flex-grow p-5 overflow-auto mt-4 justify-center bg-gray-100">
        <div className=" bg- white mb-2 p-3 bg-white rounded-lg shadow-lg mr-4">
         
            <div>
              <h3 className="text-2xl text-black font-bold mt-1">
                Route Table
              </h3>
              <div className="grid grid-cols-6 text-center bg-gray-200 justify-between p-2 mt-3 rounded-lg ">
                <div>Metric</div>
                <div>Genmask</div>
                <div>Destination</div>
                <div>Gateway</div>
                <div>Interface</div>
                <div>Flags</div>
              </div>
              {routes.map((route, index) => (
                <div
                  key={index}
                  className="grid grid-cols-6 items-center text-center justify-between bg-gray-100 p-2 mb-2 mt-2 rounded-lg"
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
