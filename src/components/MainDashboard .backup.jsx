import { useEffect } from "react";
import SideMenu from "./SideMenu";

function MainDashboard() {
  useEffect(() => {
    // Disable horizontal scrolling
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";

    return () => {
      // Re-enable scrolling when unmounted
      document.body.style.overflowX = "auto";
      document.body.style.overflowY = "auto";
    };
  }, []);

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div className="flex-grow p-1 overflow-hidden justify-center">
        <iframe
          src={`http://${window.location.hostname}:3000/d/de72jamksx14wa/network?orgId=1&from=2025-01-16T11:17:44.233Z&to=2025-01-16T11:32:44.234Z&timezone=Asia%2FKolkata&refresh=auto&kiosk`}
          frameBorder="0"
          title="Dashboard"
          className="w-full h-full"
          style={{ objectFit: "contain" }}
        ></iframe>
      </div>
    </div>
  );
}

export default MainDashboard;
