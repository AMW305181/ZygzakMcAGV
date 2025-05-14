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

// Obsługa błędów WebSocket
wss.on('error', (error) => {
    console.error('❌ Błąd serwera WebSocket:', error);
});

// Mapowanie komend - WAŻNE: Te same komendy muszą być używane w Webotsie
const COMMAND_MAPPING = {
    'FWD': 'FWD',     // Zmienione na dokładnie te same wartości, jakie oczekuje Webots
    'BACK': 'BACK',
    'LEFT': 'LEFT',
    'RIGHT': 'RIGHT',
    'STOP': 'STOP'
};

// Lista klientów WebSocket
let clients = new Set();
let webotsClient = null;

// Stan AGV
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

// Funkcja do wykrywania czy połączenie jest od Webots
function isWebotsConnection(req) {
    const userAgent = req.headers['user-agent'] || '';
    // Webots często używa prostego user-agenta lub nie używa w ogóle
    return userAgent.includes('Python') || userAgent === '' || userAgent.includes('Webots');
}

// Funkcja wysyłająca wiadomość do wszystkich klientów z wyjątkiem Webots
function broadcastToFrontend(message) {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    clients.forEach(client => {
        if (client !== webotsClient && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

// Dodaj obsługę błędów dla połączeń WebSocket
function setupWebSocketErrorHandling(ws) {
    ws.on('error', (error) => {
        console.error('❌ Błąd połączenia WebSocket:', error);

        // Jeśli to był klient Webots, oznacz jako rozłączony
        if (ws === webotsClient) {
            console.log('🤖 Klient Webots rozłączony z powodu błędu');
            webotsClient = null;

            // Informacja dla klientów frontend
            broadcastToFrontend({
                type: 'webots_connected',
                connected: false,
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    });
}

// Obsługa połączeń WebSocket
wss.on('connection', (ws, req) => {
    console.log('📱 Nowe połączenie nawiązane');

    // Dodanie klienta do listy
    clients.add(ws);

    // Dodaj obsługę błędów dla tego połączenia
    setupWebSocketErrorHandling(ws);

    // Sprawdzenie czy połączenie pochodzi od Webots
    const potentialWebotsClient = isWebotsConnection(req);
    if (potentialWebotsClient) {
        console.log('🤖 Wykryto połączenie od Webots');
        webotsClient = ws;

        // Informacja dla klientów frontend, że Webots jest połączony
        broadcastToFrontend({
            type: 'webots_connected',
            connected: true,
            timestamp: new Date().toISOString()
        });
    } else {
        // Wysłanie początkowego statusu do klienta frontend
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
    }

    // Obsługa wiadomości
    ws.on('message', (messageData) => {
        const message = messageData.toString();

        // Jeśli to wiadomość od Webots (status, itp.) - można rozbudować w przyszłości
        if (ws === webotsClient) {
            try {
                const parsedMessage = JSON.parse(message);
                console.log('📊 Otrzymano dane z Webots:', parsedMessage);

                // Tutaj można dodać obsługę statusu z Webots
                // np. aktualizować agvState i rozsyłać do klientów

                // Rozgłoszenie do frontendów
                broadcastToFrontend({
                    type: 'webots_data',
                    data: parsedMessage,
                    timestamp: new Date().toISOString()
                });
            } catch (e) {
                // Jeśli to nie JSON, tylko informacja tekstowa
                console.log('📝 Wiadomość z Webots:', message);
            }
            return;
        }

        // To jest wiadomość od frontendu z komendą
        console.log(`📨 Otrzymano komendę: ${message}`);

        // Sprawdzenie czy komenda jest prawidłowa
        const command = COMMAND_MAPPING[message];

        if (!command) {
            ws.send(JSON.stringify({
                type: 'error',
                message: `Nieznana komenda: ${message}`
            }));
            return;
        }

        // Jeśli Webots jest połączony, przekaż komendę
        if (webotsClient && webotsClient.readyState === WebSocket.OPEN) {
            try {
                // Bezpośrednie wysłanie komendy bez modyfikacji
                // To powinno zadziałać, jeśli kontroler Webots oczekuje prostego tekstu
                webotsClient.send(command);
                console.log(`📤 Wysłano komendę do Webots: ${command}`);


                // Potwierdzenie dla frontendu
                ws.send(JSON.stringify({
                    type: 'command_response',
                    command: message,
                    success: true
                }));

                // Nie aktualizujemy stanu - zakładamy, że Webots sam zaktualizuje stan
                // Jeśli Webots nie będzie wysyłał stanu, można odkomentować funkcję updateAgvState poniżej
                // updateAgvState(command);

                // Informacja o stanie dla wszystkich klientów frontend
                // Możesz zakomentować tę linię, jeśli Webots sam wysyła aktualizacje stanu
                broadcastToFrontend({
                    type: 'command_sent',
                    command: command,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('❌ Błąd przy wysyłaniu komendy do Webots:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Błąd komunikacji z Webots: ${error.message}`
                }));
            }
        } else {
            // Brak połączenia z Webots
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Brak połączenia z Webots. Komenda nie może być wykonana.'
            }));
        }
    });

    // Obsługa rozłączenia
    ws.on('close', () => {
        console.log('📴 Połączenie zakończone');
        clients.delete(ws);

        // Jeśli to był Webots, oznacz jako rozłączony
        if (ws === webotsClient) {
            webotsClient = null;
            console.log('🤖 Webots rozłączony');

            // Informacja dla klientów frontend
            broadcastToFrontend({
                type: 'webots_connected',
                connected: false,
                timestamp: new Date().toISOString()
            });
        }
    });
});

// Funkcja aktualizująca stan AGV (symulacja)
// Ta funkcja jest zakomentowana, ponieważ zakładamy, że Webots wysyła własne aktualizacje stanu
// Odkomentuj, jeśli Webots nie wysyła statusu i chcesz symulować zmiany po komendach
/*
function updateAgvState(command) {
    switch (command) {
        case 'FWD':
            agvState.isMoving = true;
            agvState.direction = 'forward';
            agvState.speed = 1.0;

            // Aktualizacja pozycji w zależności od orientacji
            const radians = agvState.orientation * Math.PI / 180;
            agvState.position.x += Math.sin(radians);
            agvState.position.y -= Math.cos(radians);
            break;

        case 'BACK':
            agvState.isMoving = true;
            agvState.direction = 'backward';
            agvState.speed = 1.0;

            // Aktualizacja pozycji w zależności od orientacji
            const backRadians = agvState.orientation * Math.PI / 180;
            agvState.position.x -= Math.sin(backRadians);
            agvState.position.y += Math.cos(backRadians);
            break;

        case 'LEFT':
            agvState.orientation = (agvState.orientation - 90 + 360) % 360;
            break;

        case 'RIGHT':
            agvState.orientation = (agvState.orientation + 90) % 360;
            break;

        case 'STOP':
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
}
*/

// Uruchomienie serwera HTTP
/*
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`🚀 Serwer uruchomiony na porcie ${PORT}`);
});
*/
const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serwer uruchomiony na porcie ${PORT}`);
});