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
          src={`http://${window.location.hostname}:3000/d/de72jamksx14wa/network?orgId=1&from=2025-03-25T10:52:31.142Z&to=2025-03-25T11:07:31.142Z&timezone=Asia%2FKolkata&refresh=auto&theme=light&kiosk=1`}
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
