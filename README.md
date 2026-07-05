# Die verlorene Sinnesmagie

Webbasierter Prototyp für ein hybrides Smartphone-Spiel zu den fünf Sinnen.

## Struktur

```text
index.html                 # Deckblatt / Startseite
story.html                 # automatische Vorgeschichte mit Bildern und Texteinblendung
game.html                  # interaktive Overworld-Karte
assets/
  css/style.css            # Design und Layout
  js/story.js              # Ablauf der Vorgeschichte
  js/game.js               # Ritterbewegung auf der Karte
  images/story/            # 10 Storybilder im 16:9-Format
  images/map/              # Overworld-Karte
  images/characters/       # Ritter-Sprite mit transparentem Hintergrund
```

## Nutzung mit GitHub Pages

1. ZIP-Datei entpacken.
2. Den Inhalt in ein neues GitHub-Repository hochladen.
3. In GitHub unter **Settings → Pages** die Bereitstellung für den Branch `main` aktivieren.
4. Danach öffnet `index.html` die Startseite des Spiels.

## Aktueller Funktionsstand

- Startseite mit Deckblatt.
- Vorgeschichte mit Pop-up: abspielen oder überspringen.
- Automatischer Bild- und Textablauf.
- Texteinblendung Wort für Wort.
- Abschlussbutton „Abenteuer beginnen“.
- Overworld-Karte mit klickbaren Gebieten.
- Ritter steht am Königsschloss und pulsiert leicht.
- Beim Antippen eines Gebietes bewegt sich der Ritter dorthin.

## Nächste sinnvolle Erweiterungen

- QR-Code-Parameter wie `game.html?area=klangwald` auswerten.
- Gebiete zunächst sperren und erst nach QR-Scan freischalten.
- Pro Gebiet ein eigenes Minigame und Quiz ergänzen.
- Fortschritt über `localStorage` speichern.
