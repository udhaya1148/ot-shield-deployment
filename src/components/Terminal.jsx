import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { io } from "socket.io-client";
import "xterm/css/xterm.css";
import { useNavigate } from "react-router-dom";
import SideMenu from "./SideMenu";

function TerminalComponent() {
  const socket = useRef(null);
  const navigate = useNavigate();

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

    // Get credentials and IP from local storage
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");
    const ip = localStorage.getItem("ip");

    if (!username || !password || !ip) {
      navigate("/login");  // Redirect to login if credentials or IP is missing
      return;
    }

    // Establish the WebSocket connection with credentials and IP as query params
    socket.current = io("http://172.18.1.231:5004", {
      query: { username, password, ip }  // Pass the IP as part of the query params
    });
    socket.current.emit("resize", { cols, rows });

    terminal.onData((input) => {
      socket.current.emit("terminal_input", { data: input });
    });

    socket.current.on("terminal_output", (data) => {
      terminal.write(data.output);
      
      // Check for logout
      if (data.output.includes("logout\r\nConnection closed.\r\n")) {
        terminal.write("\r\nSession ended. \r\n");
        setTimeout(() => {
          navigate("/home");
        }, 3000);
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
