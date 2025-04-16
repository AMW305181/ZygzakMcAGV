const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

// Konfiguracja Express
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint do sprawdzenia statusu
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Stworzenie serwera WebSocket
const wss = new WebSocket.Server({ server });

// Mapowanie komend
const COMMAND_MAPPING = {
    'FWD': 'forward',
    'BACK': 'backward',
    'LEFT': 'left',
    'RIGHT': 'right',
    'STOP': 'stop'
};

// Symulowany stan AGV
let agvState = {
    position: { x: 0, y: 0 },
    orientation: 0,
    batteryLevel: 100,
    speed: 0,
    isMoving: false,
    direction: 'none',
    errors: [],
    warnings: []
};

// Symulacja połączenia z PLC
const plcConnection = {
    connected: false,
    model: 'Siemens S7-1200',
    lastCommand: null,
    connect: function () {
        this.connected = true;
        console.log(`🔌 Połączono z PLC ${this.model}`);
        return this.connected;
    },
    disconnect: function () {
        this.connected = false;
        console.log(`🔌 Rozłączono z PLC ${this.model}`);
        return !this.connected;
    },
    sendCommand: function (command) {
        if (!this.connected) {
            return { success: false, error: 'PLC not connected' };
        }

        this.lastCommand = command;
        console.log(`📨 Wysłano komendę do PLC: ${command}`);
        return { success: true, command };
    }
};

// Próba połączenia z PLC przy starcie serwera
plcConnection.connect();

// Funkcja aktualizująca stan AGV
function updateAgvState(command) {
    // Zapisanie poprzedniej pozycji
    const prevPosition = { ...agvState.position };

    // Symulacja czasu odpowiedzi PLC
    const plcResponse = plcConnection.sendCommand(command);

    if (!plcResponse.success) {
        agvState.errors.push({
            message: 'Nie można wykonać komendy - brak połączenia z PLC',
            timestamp: new Date().toISOString()
        });
        return;
    }

    // Czyszczenie poprzednich błędów
    agvState.errors = [];

    switch (command) {
        case 'forward':
            agvState.isMoving = true;
            agvState.direction = 'forward';
            agvState.speed = 1.0;

            // Aktualizacja pozycji w zależności od orientacji
            const radians = agvState.orientation * Math.PI / 180;
            agvState.position.x += Math.sin(radians);
            agvState.position.y -= Math.cos(radians);
            break;

        case 'backward':
            agvState.isMoving = true;
            agvState.direction = 'backward';
            agvState.speed = 1.0;

            // Aktualizacja pozycji w zależności od orientacji
            const backRadians = agvState.orientation * Math.PI / 180;
            agvState.position.x -= Math.sin(backRadians);
            agvState.position.y += Math.cos(backRadians);
            break;

        case 'left':
            agvState.orientation = (agvState.orientation - 90 + 360) % 360;
            break;

        case 'right':
            agvState.orientation = (agvState.orientation + 90) % 360;
            break;

        case 'stop':
            agvState.isMoving = false;
            agvState.direction = 'none';
            agvState.speed = 0;
            break;
    }

    // Zaokrąglenie współrzędnych dla czytelności
    agvState.position.x = parseFloat(agvState.position.x.toFixed(2));
    agvState.position.y = parseFloat(agvState.position.y.toFixed(2));

    // Symulacja zużycia baterii
    if (agvState.isMoving) {
        agvState.batteryLevel = Math.max(0, agvState.batteryLevel - 0.1);
    }

    // Symulacja przeszkody (co 10-ty ruch)
    if (Math.random() < 0.1 && agvState.isMoving) {
        agvState.warnings.push({
            message: 'Wykryto potencjalną przeszkodę na trasie',
            timestamp: new Date().toISOString()
        });
    } else {
        agvState.warnings = [];
    }
}

// Obsługa połączeń WebSocket
wss.on('connection', (ws) => {
    // Cichy log tylko przy połączeniu
    console.log('📱 Nowe połączenie nawiązane');

    // Wysłanie informacji o symulacji
    ws.send(JSON.stringify({
        type: 'mode',
        simulation: true
    }));

    // Wysłanie statusu połączenia
    ws.send(JSON.stringify({
        type: 'connection_status',
        connected: true,
        timestamp: new Date().toISOString()
    }));

    // Wysłanie początkowego stanu AGV
    ws.send(JSON.stringify({
        type: 'agv_status',
        ...agvState
    }));

    // Obsługa wiadomości
    ws.on('message', (messageData) => {
        const message = messageData.toString();

        // Sprawdzenie czy komenda jest prawidłowa
        const command = COMMAND_MAPPING[message];

        if (!command) {
            ws.send(JSON.stringify({
                type: 'error',
                message: `Nieznana komenda: ${message}`
            }));
            return;
        }

        // Aktualizacja stanu AGV na podstawie komendy
        updateAgvState(command);

        // Wysłanie odpowiedzi
        ws.send(JSON.stringify({
            type: 'command_response',
            command: message,
            success: true
        }));

        // Wysłanie aktualizacji statusu
        ws.send(JSON.stringify({
            type: 'agv_status',
            ...agvState
        }));
    });

    // Obsługa rozłączenia - tylko krótki log
    ws.on('close', () => {
        console.log('📴 Połączenie zakończone');
    });
});



// Uruchomienie serwera HTTP
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`🚀 Serwer uruchomiony na porcie ${PORT}`);
});