import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { io } from "socket.io-client";
import "xterm/css/xterm.css";
import { useNavigate } from "react-router-dom";
import SideMenu from "./SideMenu";

function TerminalComponent() {
  const socket = useRef(null);
  const terminalRef = useRef(null); // Reference to the terminal div
  const navigate = useNavigate();

  useEffect(() => {
    const terminal = new Terminal({
      theme: {
        background: "#000000",
        foreground: "#FFFFFF",
      },
      cursorBlink: true,
      scrollback: 1000,  // Set scrollback buffer size
      lineHeight: 1.2,   // Control the line height for better readability
    });

    const terminalElement = terminalRef.current;
    terminal.open(terminalElement);
    terminal.write("Connecting to the SSH terminal...\r\n");

    const resizeTerminal = () => {
      const cols = Math.floor(terminalElement.offsetWidth / 8);
      const rows = Math.floor(terminalElement.offsetHeight / 18);
      terminal.resize(cols, rows);
      if (socket.current) {
        socket.current.emit("resize", { cols, rows });
      }
    };

    resizeTerminal(); // Set initial size

    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");
    const ip = localStorage.getItem("ip");

    if (!username || !password || !ip) {
      navigate("/login");
      return;
    }

    socket.current = io("http://172.18.1.240:5004", {
      query: { username, password, ip },
    });

    terminal.onData((input) => {
      socket.current.emit("terminal_input", { data: input });
    });

    socket.current.on("terminal_output", (data) => {
      terminal.write(data.output);

      if (data.output.includes("logout\r\nConnection closed.\r\n")) {
        terminal.write("\r\nSession ended. \r\n");
        setTimeout(() => {
          navigate("/home");
        }, 3000);
      }
    });

    window.addEventListener("resize", resizeTerminal);

    return () => {
      if (socket.current) socket.current.disconnect();
      terminal.dispose();
      window.removeEventListener("resize", resizeTerminal);
    };
  }, [navigate]);

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div
        id="terminal"
        ref={terminalRef}
        className="flex flex-1 h-full overflow-auto"  
        style={{
          width: "calc(100% - 250px)",  // Adjust width for the sidebar
        }}
      />
    </div>
  );
}

export default TerminalComponent;
