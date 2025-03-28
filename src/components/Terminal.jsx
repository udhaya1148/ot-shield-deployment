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
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";

    const terminalElement = terminalRef.current;
    const displayHeight = window.innerHeight;
    const lineHeight = displayHeight <= 600 ? 1.2 : displayHeight <= 900 ? 1.4 : 1.6;

    const terminal = new Terminal({
      theme: { background: "#000", foreground: "#FFF" },
      cursorBlink: true,
      scrollback: 1000,
      lineHeight: lineHeight,
    });

    terminal.open(terminalElement);
    terminal.write("Connecting to the SSH terminal...\r\n");

    // Debug: Check if sessionStorage is missing any values
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");
    const ip = sessionStorage.getItem("ip");

    if (!username || !password || !ip) {
      console.warn("Missing credentials! Redirecting to login.");
      navigate("/");
      return;
    }

    const backendUrl = `${window.location.hostname}:5054`;

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
      document.body.style.overflowX = "auto";
      document.body.style.overflowY = "auto";
    };
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <SideMenu />
      <div
        id="terminal"
        ref={terminalRef}
        className="flex-1 relative mt-3 ml-3 mr-3"
        style={{ backgroundColor: "#000", maxHeight: "70vh" }}
      />
    </div>
  );
}

export default TerminalComponent;
