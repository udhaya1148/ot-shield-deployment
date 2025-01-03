import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { io } from "socket.io-client";
import "xterm/css/xterm.css"; // Import default xterm styles
import SideMenu from "./SideMenu";

function TerminalComponent() {
  const commandBuffer = useRef(""); // Use ref to store the command buffer

  useEffect(() => {
    const terminal = new Terminal({
      theme: {
        background: "#000000", // Black background
        foreground: "#FFFFFF", // White text
      },
      cursorBlink: true, // Optional: Makes the cursor blink
    });

    terminal.open(document.getElementById("terminal"));
    terminal.write("Connecting to the SSH terminal...\r\n");

    // JavaScript for the frontend (e.g., React component)
    const socket = io.connect("172.18.1.208:5004"); // Adjust as needed

    // Listen for terminal input directly
    terminal.onData((input) => {
      if (input === '\u0008') {
        // Backspace detected, remove last character from buffer
        commandBuffer.current = commandBuffer.current.slice(0, -1);
        terminal.write('\b \b'); // Visually remove the last character
      } else if (input === '\r') {
        // Enter key pressed, send the full command
        socket.emit("terminal_input", { command: commandBuffer.current });
        commandBuffer.current = ""; // Reset buffer after sending the command
        terminal.write("\r\n"); // Move to a new line
      } else {
        // Append normal input to buffer
        commandBuffer.current += input;
        terminal.write(input); // Display the input on terminal
      }
    });

    // Receive terminal output
    socket.on("terminal_output", (data) => {
      terminal.write(data.output);
    });

    return () => {
      socket.disconnect();
      terminal.dispose();
    };
  }, []);

  return (
    <div className="flex h-screen w-screen mt=10">
      <SideMenu />
      <div
        id="terminal"
        style={{
          height: "100vh",
          width: "100%",
          backgroundColor: "#000000", // Fallback for the container
        }}
      />
    </div>
  );
}

export default TerminalComponent;
