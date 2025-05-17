import React, { useState, useEffect } from "react";
import useWebSocket from "react-use-websocket"; // Hook do obsługi WebSocket
import './App.css';
import {
    FaArrowUp,
    FaArrowDown,
    FaArrowLeft,
    FaArrowRight,
    FaStop,
    FaRobot
} from 'react-icons/fa'; // Ikony do przycisków sterujących

// Adres WebSocket serwera (adres IP komputera z symulatorem Webots)
const WS_URL = "ws://192.168.0.123:8080";

// Typ danych o statusie AGV (pozycja, kierunek itd.)
interface AgvStatus {
    position: {
        x: number;
        y: number;
    };
    direction: string;
    speed: number;
    batteryLevel: number;
}

// Typ wiadomości otrzymywanych z WebSocket
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
    // Czy Webots jest połączony
    const [webotsConnected, setWebotsConnected] = useState(false);
    
    // Status ostatnio wysłanej komendy
    const [lastCommandStatus, setLastCommandStatus] = useState<string | null>(null);

    // Inicjalizacja połączenia WebSocket
    const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL, {
        onOpen: () => console.log("✅ WebSocket połączony"),
        onClose: () => console.log("❌ WebSocket rozłączony"),
        shouldReconnect: () => true, // Automatyczne ponowne łączenie
    });

    // Obsługa przychodzących wiadomości z serwera WebSocket
    useEffect(() => {
        if (lastMessage?.data) {
            try {
                const data = JSON.parse(lastMessage.data as string) as StatusMessage;

                // Aktualizacja statusu połączenia z Webots
                if (data.type === 'webots_connected') {
                    setWebotsConnected(data.connected ?? false);
                }

                // Obsługa odpowiedzi na komendy (czy komenda się powiodła)
                if (data.type === 'command_response') {
                    setLastCommandStatus(`Komenda ${data.command} ${data.success ? 'wykonana' : 'nie powiodła się'}`);
                }

                // Obsługa błędów z WebSocket
                if (data.type === 'error') {
                    setLastCommandStatus(`Błąd: ${data.message}`);
                }

                // Otrzymanie danych o statusie AGV
                if (data.type === 'webots_data') {
                    console.log('Otrzymano dane z Webots:', data.data);
                }
            } catch (e) {
                console.error('Błąd parsowania wiadomości:', e);
            }
        }
    }, [lastMessage]);

    // Funkcja wysyłająca komendę przez WebSocket
    const sendCommand = (command: string) => {
        sendMessage(command);
        setLastCommandStatus(`Wysłano: ${command}`);
    };

    // Mapowanie kodów statusu WebSocket na czytelne komunikaty
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

            {/* Status połączeń */}
            <div className="status-container">
                <p className="status">Serwer: {wsConnectionStatus}</p>
                <p className="status">
                    Webots: {webotsConnected ? "🟢 Połączono" : "🔴 Rozłączono"} <FaRobot />
                </p>
            </div>

            {/* Przyciski sterujące */}
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

            {/* Wyświetlanie statusu ostatniej komendy */}
            {lastCommandStatus && (
                <div className="command-status">
                    Status komendy: {lastCommandStatus}
                </div>
            )}
        </div>
    );
};

export default App;
