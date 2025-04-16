# Aplikacja sterowania AGV

Aplikacja do kontroli pojazdu AGV, składająca się z backendu Node.js oraz frontendu React.

## Struktura projektu

```
ZygzakMcAGV/
├── backend/         # Serwer Node.js
├── frontend/        # Aplikacja React
├── .git/            # Repozytorium Git
└── .gitignore       # Plik ignorowania Gita
```

## Backend

Backend oparty jest na Node.js i Express, komunikuje się z PLC Siemens S7-1200 oraz obsługuje WebSocket do komunikacji z frontendem.

### Technologie
- Node.js
- Express
- WebSocket (ws)
- nodes7 (do komunikacji z PLC Siemens)

### Uruchomienie backendu

```bash
cd backend
npm install
cp .env.example .env
# Edytuj plik .env według potrzeb
npm run dev
```

## Frontend

Frontend to aplikacja React korzystająca z biblioteki react-use-websocket do komunikacji z backendem.

### Technologie
- React
- TypeScript
- react-use-websocket
- react-icons

### Uruchomienie frontendu

```bash
cd frontend
npm install
npm run dev
```

## Protokół komunikacyjny

Komunikacja między frontendem a backendem odbywa się przez WebSocket na porcie 8080.

### Komendy wysyłane przez frontend:
- `FWD` - ruch do przodu
- `BACK` - ruch do tyłu
- `LEFT` - skręt w lewo
- `RIGHT` - skręt w prawo
- `STOP` - zatrzymanie pojazdu

### Odpowiedzi wysyłane przez backend:
Backend wysyła odpowiedzi jako obiekty JSON, zawierające:
- Potwierdzenie wykonania komendy
- Aktualny status pojazdu
- Informacje o błędach (jeśli wystąpiły)

## Tryb symulacji

Backend może działać w trybie symulacji (bez rzeczywistego PLC). Tryb ten jest kontrolowany przez zmienną środowiskową `SIMULATION_MODE=true` w pliku `.env`.