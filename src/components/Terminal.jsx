import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { io } from "socket.io-client";
import "xterm/css/xterm.css";
import { useNavigate } from "react-router-dom";
import SideMenu from "./SideMenu";

function TerminalComponent() {
  const socket = useRef(null);
  const terminalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Disable scrolling for the body
    document.body.style.overflow = "hidden";

    const terminalElement = terminalRef.current;

    // Calculate dynamic line height based on display size
    const displayHeight = window.innerHeight;
    const lineHeight = displayHeight <= 600 ? 1.2 : displayHeight <= 900 ? 1.4 : 1.6;

    const terminal = new Terminal({
      theme: {
        background: "#000000", // Background for the terminal
        foreground: "#FFFFFF",
      },
      cursorBlink: true,
      scrollback: 1000,
      lineHeight: lineHeight, // Dynamically adjust line height
    });

    terminal.open(terminalElement);
    terminal.write("Connecting to the SSH terminal...\r\n");

    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");
    const ip = localStorage.getItem("ip");

    if (!username || !password || !ip) {
      navigate("/");
      return;
    }

    const backendUrl = `${window.location.hostname}:5004`;

    socket.current = io(`http://${backendUrl}`, {
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

    return () => {
      if (socket.current) socket.current.disconnect();
      terminal.dispose();

      // Re-enable scrolling for the body when the component unmounts
      document.body.style.overflow = "auto";
    };
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden">
      <SideMenu />
      <div
        id="terminal"
        ref={terminalRef}
        className="flex-1 relative mt-3 mr-3 ml-3"
        style={{
          backgroundColor: "#000",
          maxHeight: "70vh", // Restricts terminal height to viewport
        }}
      />
    </div>
  );
}

export default TerminalComponent;
