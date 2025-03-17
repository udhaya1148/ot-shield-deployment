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
    9: { width: 300, height: 300 }, // cpu usage
    13: { width: 300, height: 300 }, // memory
    14: { width: 750, height: 200 }, // proces status

    8: { width: 267, height: 109 }, //system up time
    10: { width: 267, height: 109 }, // disk total
    11: { width: 267, height: 109 }, //disk used
    12: { width: 267, height: 109 }, //disk free

    // Temperature
    21: { width: 600, height: 150 }, 
    23: { width: 600, height: 150 },
    22: { width: 600, height: 150 },
    24: { width: 600, height: 150 },

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

    30: { width: 800, height: 150 }, // static arp status
    41: { width: 700, height: 150 }, // dd to it speed
  };

  // Default size for panels not explicitly listed in panelSizes
  const defaultSize = { width: 450, height: 200 };

  // Custom panel positions using grid-row and grid-column
  const panelPositions = {
    9: { gridColumn: "1", gridRow: "1" },

    13: { gridColumn: "5", gridRow: "1" },

    14: { gridColumn: "2 /span 3", gridRow: "1" },

    8: { gridColumn: "1", gridRow: "3" },
    10: { gridColumn: "2", gridRow: "3" },
    11: { gridColumn: "3", gridRow: "3" },
    12: { gridColumn: "4", gridRow: "3" },

    21: { gridColumn: "1 /span 2", gridRow: "4" },
    23: { gridColumn: "3 /span 4 ", gridRow: "4" },
    22: { gridColumn: "1 / span 2", gridRow: "5" },
    24: { gridColumn: "3 /span 4", gridRow: "5" },

    1: { gridColumn: "1", gridRow: "6" },
    3: { gridColumn: "2", gridRow: "6" },
    4: { gridColumn: "3", gridRow: "6" },
    5: { gridColumn: "4", gridRow: "6" },
    6: { gridColumn: "5", gridRow: "6" },

    20: { gridColumn: "1", gridRow: "7" },
    25: { gridColumn: "2", gridRow: "7" },
    26: { gridColumn: "3", gridRow: "7" },
    27: { gridColumn: "4", gridRow: "7" },
    28: { gridColumn: "5", gridRow: "7" },

    15: { gridColumn: "1", gridRow: "8" },
    16: { gridColumn: "2", gridRow: "8" },
    17: { gridColumn: "3", gridRow: "8" },
    18: { gridColumn: "4", gridRow: "8" },
    19: { gridColumn: "5", gridRow: "8" },

    31: { gridColumn: "1", gridRow: "9" },
    32: { gridColumn: "2", gridRow: "9" },
    34: { gridColumn: "3", gridRow: "9" },
    36: { gridColumn: "4", gridRow: "9" },
    38: { gridColumn: "5", gridRow: "9" },

    33: { gridColumn: "1", gridRow: "10" },
    35: { gridColumn: "2", gridRow: "10" },
    37: { gridColumn: "3", gridRow: "10" },
    39: { gridColumn: "4", gridRow: "10" },
    40: { gridColumn: "5", gridRow: "10" },

    30: { gridColumn: "1 /span 3", gridRow: "11" },
    41: { gridColumn: "4 /span 5 ", gridRow: "11" },
  };

  const dashboardUrl = `http://${window.location.hostname}:3000/d-solo/de72jamksx14wa/network?orgId=1&timezone=Asia%2FKolkata&refresh=auto&theme=light`;

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div
        className="flex-grow p-1 overflow-auto overflow-x-hidden grid gap-4"
        style={{
          gridTemplateColumns: "repeat(5, 1fr)",
          gridAutoRows: "min-content",
        }}
      >
        {panelIds.map((panelId, index) => {
          const { width, height } = panelSizes[panelId] || defaultSize;
          const { gridColumn, gridRow } = panelPositions[panelId] || {};

          return (
            <div
              key={index}
              style={{
                gridColumn,
                gridRow,
                maxWidth: "100%", 
              }}
              className="flex justify-center items-center"
            >
              {index < 5 ? ( 
                <iframe
                  src={`${dashboardUrl}&panelId=${panelId}`}
                  width={width}
                  height={height}
                  frameBorder="0"
                  className="max-w-full"
                ></iframe>
              ) : (
                <LazyLoad height={height} offset={100}>
                  <iframe
                    src={`${dashboardUrl}&panelId=${panelId}`}
                    width={width}
                    height={height}
                    frameBorder="0"
                    className="max-w-full"
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
