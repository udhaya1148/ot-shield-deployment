import { useEffect } from "react";
import SideMenu from "./SideMenu";

function MainDashboard() {
  useEffect(() => {
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";
    return () => {
      document.body.style.overflowX = "auto";
      document.body.style.overflowY = "auto";
    };
  }, []);

  const panelIds = [
    9, 8, 10, 11, 12, 13, 14, 21, 23, 22, 24, 1, 3, 4, 5, 6, 20, 25, 26, 27, 28,
    15, 16, 17, 18, 19, 31, 32, 34, 36, 38, 33, 35, 37, 39, 40, 30, 41,
  ];

  const panelSizes = {
    9: { width: 300, height: 300 }, // CPU usage
    14: { width: 800, height: 300 }, // Process status
    13: { width: 300, height: 300 }, // Memory
    8: { width: 267, height: 109 }, // System uptime
    10: { width: 267, height: 109 }, // Disk total
    11: { width: 267, height: 109 }, // Disk used
    12: { width: 267, height: 109 }, // Disk free
    21: { width: 600, height: 75 }, 23: { width: 600, height: 75 },
    22: { width: 600, height: 75 }, 24: { width: 600, height: 75 },
    1: { width: 267, height: 109 }, 3: { width: 267, height: 109 },
    4: { width: 267, height: 109 }, 5: { width: 267, height: 109 },
    6: { width: 267, height: 109 },
    20: { width: 267, height: 109 }, 25: { width: 267, height: 109 },
    26: { width: 267, height: 109 }, 27: { width: 267, height: 109 },
    28: { width: 267, height: 109 },
    15: { width: 267, height: 109 }, 16: { width: 267, height: 109 },
    17: { width: 267, height: 109 }, 18: { width: 267, height: 109 },
    19: { width: 267, height: 109 },
    31: { width: 267, height: 109 }, 32: { width: 267, height: 109 },
    34: { width: 267, height: 109 }, 36: { width: 267, height: 109 },
    38: { width: 267, height: 109 },
    33: { width: 267, height: 109 }, 35: { width: 267, height: 109 },
    37: { width: 267, height: 109 }, 39: { width: 267, height: 109 },
    40: { width: 267, height: 109 },
    30: { width: 800, height: 150 }, // Static ARP Status
    41: { width: 700, height: 150 }, // DD to IT speed
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
    // Network Interface State
    1: { gridColumn: "1", gridRow: "7" },
    3: { gridColumn: "2", gridRow: "7" },
    4: { gridColumn: "3", gridRow: "7" },
    5: { gridColumn: "4", gridRow: "7" },
    6: { gridColumn: "5", gridRow: "7" },
    20: { gridColumn: "1", gridRow: "8" },
    25: { gridColumn: "2", gridRow: "8" },
    26: { gridColumn: "3", gridRow: "8" },
    27: { gridColumn: "4", gridRow: "8" },
    28: { gridColumn: "5", gridRow: "8" },
    15: { gridColumn: "1", gridRow: "9" },
    16: { gridColumn: "2", gridRow: "9" },
    17: { gridColumn: "3", gridRow: "9" },
    18: { gridColumn: "4", gridRow: "9" },
    19: { gridColumn: "5", gridRow: "9" },
    31: { gridColumn: "1", gridRow: "10" },
    32: { gridColumn: "2", gridRow: "10" },
    34: { gridColumn: "3", gridRow: "10" },
    36: { gridColumn: "4", gridRow: "10" },
    38: { gridColumn: "5", gridRow: "10" },
    33: { gridColumn: "1", gridRow: "11" },
    35: { gridColumn: "2", gridRow: "11" },
    37: { gridColumn: "3", gridRow: "11" },
    39: { gridColumn: "4", gridRow: "11" },
    40: { gridColumn: "5", gridRow: "11" },
    30: { gridColumn: "1 / span 3", gridRow: "12" },
    41: { gridColumn: "4 / span 2", gridRow: "12" },
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

        {/* Network Interface heading */}
        <div className="col-span-5 row-start-6 text-2xl font-bold text-gray-700 pb-2">
          Network Interface State
        </div>
      </div>
    </div>
  );
}

export default MainDashboard;
