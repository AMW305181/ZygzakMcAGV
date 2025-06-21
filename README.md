# Instukcja użytkownika

Instrukcja przewiduje uruchomienie serwera na systemie Windows - z samej aplikacji można korzystać na innych urządzeniach w tej samej sieci.

## Przed uruchomieniem aplikacji

Upewnij się, że na komputerze jest zainstalowany Node.js.

## Uruchomienie aplikacji

1. Pobierz program z repozytorium i otwórz w wybranym środowisku.
2. W pliku /frontend/src/App.tsx, w zmiennej WS_URL wpisz adres ip komputera (zachowaj wartość portu lokalnego - :8080), na którym będzie uruchomiony serwer (możesz wykorzystać polecenie ip config w konsoli).
3. W katalogach frontend i backend wykonaj polecenie "npm install".
4. W tych katalogach (w osobnych konsolach) wykonaj polecnie "npm run dev".
5. W konsoli frontendu zostaną wyświetlone 2 adresy ip - strona aplikacji znajduje się na drugim adresie. 
6. Do symulacji przesyła się polecenia za pomocą przycisków reprezentujących kierunki "przód" ▲, "prawo"　▶, "lewo"　◀, "tył"　▼, "stop"　■. Jeżeli polecenia nie uda się przesłać ze względu na brak połączenia, zostanie wyświetlony odpowiedni komunikat. 

## Uruchomienie symulacji

1. Pobierz aplikację Webots i postępuj zgodnie z instrukcjami. (https://cyberbotics.com/).
2. Po uruchomieniu Webots wybierz na pasku narzędzi File->Open world i w eksploratorze plików wybierz plik .wbt zawarty w katalogu /webots/worlds.
3. W eksploratorze obiektów po lewej stronie rozwiń obiekt "Robot" i wybierz pole "controller". Na dole, wybierz opcję edit i w polu tekstowym, w metodzie __init__, wpisz w miejsce podanego adresu ip swój adres serwera (zachowaj wartość portu lokalnego - :8080).
4. Aby uruchomić symulację, naciśnij przycisk "Run the simulation in real time"　(▶) lub skorzystaj ze skrótu Ctrl+2.
5. Jeżeli w konsoli na dole Webots wyświetlił się komunikat "Connected to server" - aplikacja działa poprawnie i mozna sterować samochodzikiem. W przeciwnym wypadku upewnij się, że wszystkie kroki instrukcji zostały wykonane poprawnie. GG powodzenia.
6. W razie kłopotów skonsultuj się z dokumentacją Webots.