import { useEffect } from "react";
import SideMenu from "./SideMenu";

function NetworkInterfacestate() {
  useEffect(() => {
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";
    return () => {
      document.body.style.overflowX = "auto";
      document.body.style.overflowY = "auto";
    };
  }, []);

  const panelIds = [ 1, 3, 4, 5, 6, 20, 25, 26, 27, 28,
    15, 16, 17, 18, 19, 31, 32, 34, 36, 38, 33, 35, 37, 39, 40, 30, 41,
  ];

  const panelSizes = {
  
    // Ethernet ports
    1: { width: 267, height: 109 },
    3: { width: 267, height: 109 },
    4: { width: 267, height: 109 },
    5: { width: 267, height: 109 },
    6: { width: 267, height: 109 },

    // Link speed
    20: { width: 267, height: 109 },
    25: { width: 267, height: 109 },
    26: { width: 267, height: 109 },
    27: { width: 267, height: 109 },
    28: { width: 267, height: 109 },

    // IP
    15: { width: 267, height: 109 },
    16: { width: 267, height: 109 },
    17: { width: 267, height: 109 },
    18: { width: 267, height: 109 },
    19: { width: 267, height: 109 },

    // Rx Bytes
    31: { width: 267, height: 109 },
    32: { width: 267, height: 109 },
    34: { width: 267, height: 109 },
    36: { width: 267, height: 109 },
    38: { width: 267, height: 109 },

    // Tx Bytes
    33: { width: 267, height: 109 },
    35: { width: 267, height: 109 },
    37: { width: 267, height: 109 },
    39: { width: 267, height: 109 },
    40: { width: 267, height: 109 },

    30: { width: 800, height: 150 }, // Static ARP Status
    41: { width: 700, height: 150 }, // DD to IT speed
  };

  const defaultSize = { width: 450, height: 200 };

  const panelPositions = {
  
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
        className="flex-grow p-4 overflow-auto grid"
        style={{
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gridAutoRows: "min-content",
          gap: "0.25rem", // reduced gap between panels
        }}
      >
        {/* Network Interface State heading */}
        <div className="col-span-5 row-start-1 text-2xl font-bold text-black pb-2">
        Network Interface State
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
                className="max-w-full rounded-lg bg-gray-200"
              ></iframe>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NetworkInterfacestate;
