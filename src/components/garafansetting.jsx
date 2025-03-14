import { useEffect } from "react";
import LazyLoad from "react-lazyload";
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
    9: { width: 400, height: 300 }, // Increased size
    8: { width: 219, height: 104 },
    10: { width: 157, height: 110 },
    11: { width: 163, height: 104 },
    12: { width: 162, height: 105 },
    13: { width: 400, height: 300 }, // Increased size
    14: { width: 800, height: 200 }, // Increased size
    21: { width: 400, height: 150 }, // Increased size
    23: { width: 400, height: 150 }, // Increased size
    22: { width: 400, height: 150 }, // Increased size
    24: { width: 400, height: 150 }, // Increased size
    1: { width: 267, height: 109 },
    3: { width: 267, height: 109 },
    4: { width: 267, height: 109 },
    5: { width: 267, height: 109 },
    6: { width: 267, height: 109 },
    20: { width: 267, height: 109 },
    25: { width: 267, height: 109 },
    26: { width: 267, height: 109 },
    27: { width: 267, height: 109 },
    28: { width: 267, height: 109 },
    15: { width: 267, height: 109 },
    16: { width: 267, height: 109 },
    17: { width: 267, height: 109 },
    18: { width: 267, height: 109 },
    19: { width: 267, height: 109 },
    31: { width: 267, height: 109 },
    32: { width: 267, height: 109 },
    34: { width: 267, height: 109 },
    36: { width: 267, height: 109 },
    38: { width: 267, height: 109 },
    33: { width: 267, height: 109 },
    35: { width: 267, height: 109 },
    37: { width: 267, height: 109 },
    39: { width: 267, height: 109 },
    40: { width: 267, height: 109 },
    30: { width: 900, height: 200 }, // Increased size
    41: { width: 700, height: 200 }, // Increased size
  };

  // Default size for panels not explicitly listed in panelSizes
  const defaultSize = { width: 450, height: 200 };

  // Custom panel positions using grid-row and grid-column
  const panelPositions = {
    9: { gridColumn: "1", gridRow: "1" },
    13: { gridColumn: "2", gridRow: "1" },
    14: { gridColumn: "3 / span 2", gridRow: "1" },
    8: { gridColumn: "1", gridRow: "2" },
    10: { gridColumn: "2", gridRow: "2" },
    11: { gridColumn: "3", gridRow: "2" },
    12: { gridColumn: "4", gridRow: "2" },
    21: { gridColumn: "1", gridRow: "3" },
    23: { gridColumn: "2", gridRow: "3" },
    22: { gridColumn: "1", gridRow: "4" },
    24: { gridColumn: "2", gridRow: "4" },
    1: { gridColumn: "1", gridRow: "5" },
    3: { gridColumn: "2", gridRow: "5" },
    4: { gridColumn: "3", gridRow: "5" },
    5: { gridColumn: "4", gridRow: "5" },
    6: { gridColumn: "5", gridRow: "5" },
    20: { gridColumn: "1", gridRow: "6" },
    25: { gridColumn: "2", gridRow: "6" },
    26: { gridColumn: "3", gridRow: "6" },
    27: { gridColumn: "4", gridRow: "6" },
    28: { gridColumn: "5", gridRow: "6" },
    15: { gridColumn: "1", gridRow: "7" },
    16: { gridColumn: "2", gridRow: "7" },
    17: { gridColumn: "3", gridRow: "7" },
    18: { gridColumn: "4", gridRow: "7" },
    19: { gridColumn: "5", gridRow: "7" },
    31: { gridColumn: "1", gridRow: "8" },
    32: { gridColumn: "2", gridRow: "8" },
    34: { gridColumn: "3", gridRow: "8" },
    36: { gridColumn: "4", gridRow: "8" },
    38: { gridColumn: "5", gridRow: "8" },
    33: { gridColumn: "1", gridRow: "9" },
    35: { gridColumn: "2", gridRow: "9" },
    37: { gridColumn: "3", gridRow: "9" },
    39: { gridColumn: "4", gridRow: "9" },
    40: { gridColumn: "5", gridRow: "9" },
    30: { gridColumn: "1 / span 3", gridRow: "10" },
    41: { gridColumn: "4 / span 2", gridRow: "10" },
  };

  const dashboardUrl = `http://${window.location.hostname}:3000/d-solo/de72jamksx14wa/network?orgId=1&timezone=Asia%2FKolkata&refresh=auto&theme=light`;

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div
        className="flex-grow p-1 overflow-auto grid gap-4 auto-rows-min"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        }}
      >
        {panelIds.map((panelId, index) => {
          const { width, height } = panelSizes[panelId] || defaultSize;
          const { gridColumn, gridRow } = panelPositions[panelId] || {};

          return (
            <div
              key={index}
              style={{ gridColumn, gridRow }}
              className="w-full h-full"
            >
              {index < 5 ? ( // Preload the first 5 panels
                <iframe
                  src={`${dashboardUrl}&panelId=${panelId}`}
                  width={width}
                  height={height}
                  frameBorder="0"
                  className="w-full h-full"
                ></iframe>
              ) : (
                <LazyLoad height={height} offset={100}>
                  <iframe
                    src={`${dashboardUrl}&panelId=${panelId}`}
                    width={width}
                    height={height}
                    frameBorder="0"
                    className="w-full h-full"
                  ></iframe>
                </LazyLoad>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MainDashboard;
