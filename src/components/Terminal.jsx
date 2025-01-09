import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { io } from "socket.io-client";
import "xterm/css/xterm.css";
import SideMenu from "./SideMenu";

function TerminalComponent() {
  const commandBuffer = useRef(""); // Current command being typed
  const socket = useRef(null);

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

    const cols = Math.floor(window.innerWidth / 8); // Character width in pixels
    const rows = Math.floor(window.innerHeight / 18); // Character height in pixels

    socket.current = io("http://172.18.1.230:5004"); // Replace with your backend server's IP/URL
    socket.current.emit("resize", { cols, rows }); // Send terminal size to the backend

    terminal.onData((input) => {
      socket.current.emit("terminal_input", { data: input });
    });

    socket.current.on("terminal_output", (data) => {
      terminal.write(data.output);
      if (data.output === 'logout\r\nConnection closed.\r\n') {
        // Handle logout and connection closed output here
        terminal.write("\r\nSession ended. You can close the terminal.\r\n");
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
  }, []);

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div id="terminal" style={{ height: "100vh", width: "100%" }} />
    </div>
  );
}

export default TerminalComponent;
