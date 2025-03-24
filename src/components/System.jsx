import { useEffect } from "react";
import SideMenu from "./SideMenu";

function System() {
  useEffect(() => {
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";
    return () => {
      document.body.style.overflowX = "auto";
      document.body.style.overflowY = "auto";
    };
  }, []);

  const panelIds = [ 9, 8, 10, 11, 12, 13, 14, 21, 23, 22, 24 ];

  const panelSizes = {
    9: { width: 300, height: 300 }, // CPU usage
    14: { width: 800, height: 300 }, // Process status
    13: { width: 300, height: 300 }, // Memory

    8: { width: 267, height: 109 }, // System uptime
    10: { width: 267, height: 109 }, // Disk total
    11: { width: 267, height: 109 }, // Disk used
    12: { width: 267, height: 109 }, // Disk free

    // Temperature
    21: { width: 600, height: 75 },
    23: { width: 600, height: 75 },
    22: { width: 600, height: 75 },
    24: { width: 600, height: 75 },

  };

  const defaultSize = { width: 450, height: 200 };

  const panelPositions = {
    // System
    9: { gridColumn: "1", gridRow: "2" },
    14: { gridColumn: "2 / span 3", gridRow: "2" },
    13: { gridColumn: "5", gridRow: "2" },

    8: { gridColumn: "1", gridRow: "3" },
    10: { gridColumn: "2", gridRow: "3" },
    11: { gridColumn: "3", gridRow: "3" },
    12: { gridColumn: "4", gridRow: "3" },

    21: { gridColumn: "1 / span 2", gridRow: "4" },
    23: { gridColumn: "3 / span 2", gridRow: "4" },
    22: { gridColumn: "1 / span 2", gridRow: "5" },
    24: { gridColumn: "3 / span 2", gridRow: "5" },

  };

  const dashboardUrl = `http://${window.location.hostname}:3000/d-solo/de72jamksx14wa/network?orgId=1&timezone=Asia%2FKolkata&refresh=auto&theme=light`;

  return (
    <div className="flex flex-row h-screen w-screen bg-gray-50">
      <SideMenu />
      <div
        className="flex-grow p-4 overflow-auto grid bg-gray-200"
        style={{
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gridAutoRows: "min-content",
          gap: "0.25rem", // reduced gap between panels
        }}
      >
        {/* System heading */}
        <div className="col-span-5 row-start-1 text-2xl font-bold text-gray-700 pb-2">
          System
        </div>

        {panelIds.map((panelId, index) => {
          const { width, height } = panelSizes[panelId] || defaultSize;
          const { gridColumn, gridRow } = panelPositions[panelId] || {};

          return (
            <div
              key={index}
              style={{ gridColumn, gridRow }}
              className="flex justify-center items-center p-0.5"
            >
              <iframe
                src={`${dashboardUrl}&panelId=${panelId}`}
                width={width}
                height={height}
                frameBorder="0"
                className="max-w-full rounded-lg"
              ></iframe>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default System;
