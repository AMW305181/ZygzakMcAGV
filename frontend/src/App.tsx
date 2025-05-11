import React, { useState, useEffect } from "react";
import useWebSocket from "react-use-websocket";
import './App.css';
import {
    FaArrowUp,
    FaArrowDown,
    FaArrowLeft,
    FaArrowRight,
    FaStop,
    FaRobot
} from 'react-icons/fa';

const WS_URL = "ws://localhost:8080";

interface AgvStatus {
    position: {
        x: number;
        y: number;
    };
    direction: string;
    speed: number;
    batteryLevel: number;
}


interface StatusMessage {
    type: string;
    timestamp: string;
    connected?: boolean;
    data?: AgvStatus;
    message?: string;
    command?: string;
    success?: boolean;
}


const App: React.FC = () => {
    const [webotsConnected, setWebotsConnected] = useState(false);
    const [lastCommandStatus, setLastCommandStatus] = useState<string | null>(null);
    const [agvStatus, setAgvStatus] = useState<AgvStatus | null>(null);

    const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL, {
        onOpen: () => console.log("✅ WebSocket połączony"),
        onClose: () => console.log("❌ WebSocket rozłączony"),
        shouldReconnect: () => true,
    });

    // Obsługa przychodzących wiadomości
    useEffect(() => {
        if (lastMessage?.data) {
            try {
                const data = JSON.parse(lastMessage.data as string) as StatusMessage;

                // Aktualizacja statusu połączenia z Webotsem
                if (data.type === 'webots_connected') {
                    setWebotsConnected(data.connected ?? false);
                }

                // Obsługa odpowiedzi na komendy
                if (data.type === 'command_response') {
                    setLastCommandStatus(`Komenda ${data.command} ${data.success ? 'wykonana' : 'nie powiodła się'}`);
                }

                // Obsługa błędów
                if (data.type === 'error') {
                    setLastCommandStatus(`Błąd: ${data.message}`);
                }

                // Aktualizacja stanu AGV
                if (data.type === 'agv_status' && data.data) {
                    const agvData = data.data as AgvStatus;
                    setAgvStatus(agvData);
                }

                // Dane z Webots
                if (data.type === 'webots_data') {
                    console.log('Otrzymano dane z Webots:', data.data);
                }
            } catch (e) {
                console.error('Błąd parsowania wiadomości:', e);
            }
        }
    }, [lastMessage]);

    const sendCommand = (command: string) => {
        sendMessage(command);
        setLastCommandStatus(`Wysłano: ${command}`);
    };

    // Status połączenia z serwerem WebSocket
    const wsConnectionStatusMap: Record<number, string> = {
        0: "🔴 Łączenie...",
        1: "🟢 Połączono",
        2: "🟠 Zamykanie",
        3: "🔴 Rozłączono",
    };

    const wsConnectionStatus = wsConnectionStatusMap[readyState] || "❔ Nieznany status";

    return (
        <div className="app-container">
            <h1>Sterowanie AGV</h1>
            <h1>🚗 wrrruuum</h1>

            <div className="status-container">
                <p className="status">Serwer: {wsConnectionStatus}</p>
                <p className="status">
                    Webots: {webotsConnected ? "🟢 Połączono" : "🔴 Rozłączono"} <FaRobot />
                </p>
            </div>

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

            {lastCommandStatus && (
                <div className="command-status">
                    Status komendy: {lastCommandStatus}
                </div>
            )}

            <div className="status-panel">
                <h3>Informacje o AGV</h3>
                {agvStatus ? (
                    <div className="agv-info">
                        <p>Pozycja: X: {agvStatus.position?.x.toFixed(2)}, Y: {agvStatus.position?.y.toFixed(2)}</p>
                        <p>Kierunek: {agvStatus.direction}</p>
                        <p>Prędkość: {agvStatus.speed}</p>
                        <p>Bateria: {agvStatus.batteryLevel}%</p>
                    </div>
                ) : (
                    <p>Oczekiwanie na dane AGV...</p>
                )}
            </div>
        </div>
    );
};

export default App;