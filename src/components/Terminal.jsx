import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { io } from "socket.io-client";
import "xterm/css/xterm.css";
import { useNavigate } from "react-router-dom";
import SideMenu from "./SideMenu";

function TerminalComponent() {
  const socket = useRef(null);
  const navigate = useNavigate();  // Ensure this is defined

  useEffect(() => {
    const terminal = new Terminal({
      theme: {
        background: "#000000",
        foreground: "#FFFFFF",
      },
      cursorBlink: true,
    });

    terminal.open(document.getElementById("terminal"));
    terminal.write("Connecting to the SSH terminal...\r\n");

    const cols = Math.floor(window.innerWidth / 8);
    const rows = Math.floor(window.innerHeight / 18);

    socket.current = io("http://172.18.1.229:5004");  // Make sure the backend is running on this IP
    socket.current.emit("resize", { cols, rows });

    terminal.onData((input) => {
      socket.current.emit("terminal_input", { data: input });
    });

    socket.current.on("terminal_output", (data) => {
      terminal.write(data.output);

      // Check if the output contains the logout message and redirect
      if (data.output.includes("logout\r\nConnection closed.\r\n")) {
        console.log("Logout detected. Redirecting to home...");
        terminal.write("\r\nSession ended. You can close the terminal.\r\n");

        // Delay before redirecting to allow the user to see the logout message
        setTimeout(() => {
          navigate("/");  // Redirect to the home page
        }, 2000);  // 2-second delay before redirect
      }
    });

    const handleResize = () => {
      const newCols = Math.floor(window.innerWidth / 8);
      const newRows = Math.floor(window.innerHeight / 18);
      terminal.resize(newCols, newRows);
      socket.current.emit("resize", { cols: newCols, rows: newRows });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      socket.current.disconnect();
      terminal.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, [navigate]);

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div id="terminal" style={{ height: "100vh", width: "100%" }} />
    </div>
  );
}

export default TerminalComponent;
