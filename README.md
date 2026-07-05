# Die verlorene Sinnesmagie

Webbasierter Prototyp für ein hybrides Smartphone-Spiel zu den fünf Sinnen.

## Struktur

```text
index.html                 # Deckblatt / Startseite
story.html                 # automatische Vorgeschichte mit Bildern und Texteinblendung
game.html                  # interaktive Overworld-Karte
qr-codes.html              # druckbare Übersicht der QR-Codes
assets/
  css/style.css            # Design und Layout
  js/story.js              # Ablauf der Vorgeschichte
  js/game.js               # Spielfeld, Locks, QR-Freischaltung, Ritterbewegung
  images/story/            # 10 Storybilder in 16:9
  images/map/              # Overworld-Karte
  images/characters/       # Ritter-Sprite mit transparentem Hintergrund
  qr/                      # QR-Codes zum Freischalten der Gebiete
```

## Nutzung mit GitHub Pages

1. ZIP-Datei entpacken.
2. Den Inhalt in ein GitHub-Repository hochladen.
3. In GitHub unter **Settings → Pages** die Bereitstellung für den Branch `main` und den Ordner `/root` aktivieren.
4. Startseite öffnen:

```text
https://markspringerprivat-cmd.github.io/sinne/
```

## QR-Code-Freischaltung

Die Sinnesgebiete und das Zauberschloss sind am Anfang gesperrt. Auf der Karte liegt über jedem gesperrten Gebiet ein Schloss-Symbol. Beim Antippen erscheint der Hinweis, dass der passende QR-Code an der Station gescannt werden muss.

Die QR-Codes liegen hier:

```text
assets/qr/unlock-farbenreich.png
assets/qr/unlock-klangwald.png
assets/qr/unlock-tastminen.png
assets/qr/unlock-duftgarten.png
assets/qr/unlock-flammenkueche.png
assets/qr/unlock-zauberschloss.png
```

Zum Ausdrucken kann die Datei geöffnet werden:

```text
qr-codes.html
```

Die QR-Codes zeigen aktuell auf:

```text
https://markspringerprivat-cmd.github.io/sinne/game.html?unlock=...
```

Wenn das Repository anders heißt oder unter einer anderen Adresse veröffentlicht wird, müssen die QR-Codes neu erzeugt oder die Zieladressen angepasst werden.

## Aktueller Funktionsstand

- Deckblatt mit Startbutton
- automatische Vorgeschichte mit optionalem Überspringen
- Vollbild-Spielfeld für Smartphone ohne Scrollen
- Ritter startet beim Königsschloss und pulsiert leicht
- unsichtbare klickbare Gebiete auf der Karte
- gesperrte Gebiete sind ausgegraut und haben ein Schloss-Symbol
- QR-Codes schalten die passenden Gebiete frei
- der Ritter kann nur zu freigeschalteten Gebieten laufen
- unten rechts befindet sich ein Einstellungsbutton mit leerem Pop-up


## Aktueller Stand

- Statische Overworld-Karte mit transparenten Klickflächen
- Gesperrte Gebiete werden nur durch ein großes Schloss-Symbol markiert
- Beim Tippen auf ein gesperrtes Gebiet erscheint ein Pop-up mit Zurück- und QR-Code-Scanner-Button
- QR-Codes können über URL-Parameter oder den integrierten Kamera-Scanner freischalten

## Erweiterungen

- Beim ersten Betreten des Spielfelds erscheint ein dreiteiliges Einführungs-Pop-up.
- Die Hintergrundmusik `assets/audio/spielfeld.mp3` startet nach Klick auf „Abenteuer beginnen“.
- In den Einstellungen gibt es einen Lautstärkeregler.
- In den Einstellungen können alle QR-Codes eingeblendet werden.
- Gesperrte Gebiete zeigen nur ein Schloss-Symbol; die Karte bleibt sichtbar.
- Freigeschaltete Level führen zu eigenen HTML-Seiten unter `levels/`.
- Zurück aus einem Level führt zu `game.html?fromLevel=1` und zeigt ein Rückkehr-Pop-up.


## Level-Hintergründe

Die einzelnen Level-HTMLs verwenden eigene Vollbild-Hintergründe unter `assets/images/level-backgrounds/`.
Jedes Level startet mit dem Ritter am Eingang und enthält zwei halbtransparente Klickflächen als Platzhalter für Minispiel und Quiz/Bossbereich.
