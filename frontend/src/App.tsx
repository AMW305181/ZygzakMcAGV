import React from "react";
import useWebSocket from "react-use-websocket";
import './App.css'
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaArrowLeft, 
  FaArrowRight,
  FaStop
} from 'react-icons/fa';

const WS_URL = "ws://localhost:8080"; // ← IP/port naszego backendu

const App: React.FC = () => {
  const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => console.log("✅ WebSocket połączony"),
    onClose: () => console.log("❌ WebSocket rozłączony"),
    shouldReconnect: () => true,
  });

  const sendCommand = (command: string) => {
    sendMessage(command);
  };

  const connectionStatusMap: Record<number, string> = {
    0: "🔴 Łączenie...",
    1: "🟢 Połączono",
    2: "🟠 Zamykanie",
    3: "🔴 Rozłączono",
  };
  
  const connectionStatus = connectionStatusMap[readyState] || "❔ Nieznany status";

  return (
    <div className="app-container">
      <h1>Sterowanie AGV</h1>
      <h1>🚗 wrrruuum</h1>
      <p className="status">Status połączenia: {connectionStatus}</p>
  
      <div className="grid-controls">
        <div></div>
        <button onClick={() => sendCommand("FWD")}><FaArrowUp /></button>
        <div></div>

        <button onClick={() => sendCommand("LEFT")}><FaArrowLeft /></button>
        <button onClick={() => sendCommand("STOP")}><FaStop /></button>
        <button onClick={() => sendCommand("RIGHT")}><FaArrowRight /></button>

        <div></div>
        <button onClick={() => sendCommand("BACK")}><FaArrowDown /></button>
        <div></div>
      </div>
  
      <div className="last-message">
        Ostatnia wiadomość z backendu: {lastMessage?.data || "Brak"}
      </div>
    </div>
  );
};

export default App
