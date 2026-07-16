Version 125 – umfassende Spielkorrekturen

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
- Die Hintergrundmusik `assets/audio/overworld_new.mp3` startet nach Klick auf „Abenteuer beginnen“.
- In den Einstellungen gibt es einen Lautstärkeregler.
- In den Einstellungen können alle QR-Codes eingeblendet werden.
- Gesperrte Gebiete zeigen nur ein Schloss-Symbol; die Karte bleibt sichtbar.
- Freigeschaltete Level führen zu eigenen HTML-Seiten unter `levels/`.
- Zurück aus einem Level führt zu `game.html?fromLevel=1` und zeigt ein Rückkehr-Pop-up.


## Level-Hintergründe

Die einzelnen Level-HTMLs verwenden eigene Vollbild-Hintergründe unter `assets/images/level-backgrounds/`.
Jedes Level startet mit dem Ritter am Eingang und enthält zwei halbtransparente Klickflächen als Platzhalter für Minispiel und Quiz/Bossbereich.


## Update Levelkarten

- Levelkarten füllen den Bildschirm per `object-fit: cover`, damit keine Balken entstehen.
- Levelpunkte sind sichtbar kleiner, behalten aber eine großzügige Klickfläche.
- Levelseiten zeigen beim Betreten ein Platzhalter-Pop-up; nach „Weiter“ startet die Musik.
- In den Einstellungen gibt es einen Button zum Zurücksetzen des Spielstands.


## Update: Quiz-Level

Die zweiten Levelpunkte der Levelkarten starten nun ein Kampf-Quiz mit sieben Fragen, 30-Sekunden-Timer, drei Herzen, Ritter-/Gegner-Animationen und Ergebnisbildschirm.

## Version 88 – Finale Energieball-Phase
- Nach der Hörsinnphase startet eine letzte 30-Sekunden-Prüfung mit Richtig/Falsch-Aussagen zu allen Sinnen.
- Der Zauberer beschwört dabei einen wachsenden Energieball.
- Bei Erfolg springt der leuchtende Ritter in den Ball, der explodiert und den Zauberer besiegt.
- Bei Zeitablauf wird der Energieball auf den Ritter geschossen und der Kampf gilt als verloren.
- Beim Sieg wird die Bossmusik ausgeblendet und `castle_finale_itsover.mp3` eingespielt.


## Version 90
- Finale Kampfszene ohne verbleibenden Blur-Overlay
- Magier, Energiekugel und Ritter exakt auf einer vertikalen Achse
- Bossmusik bleibt während der letzten Prüfung auf stabiler Lautstärke
- Siegerfiguren im Boss-besiegt-Bild deutlich nach oben versetzt
- Die Bossmusik wird vor ihrem im Audiomaterial enthaltenen leisen Ausklang sauber in den stabilen Mittelteil zurückgesetzt.

## Version 91 – Zauberschloss-Finale

- Die Siegfiguren liegen in einer eigenen Ebene und werden automatisch vollständig oberhalb des Ergebnis-Pop-ups positioniert.
- Die Bossmusik läuft bis zum Verlassen des Ergebnisses weiter; das frühere alternative Finalstück wird nicht mehr gestartet.
- Nach der Rückkehr zur Weltkarte erscheint die Schaltfläche „Zurück zum Zauberschloss“.
- Beim erneuten Betreten des Zauberschlosses wird angezeigt, dass das nächste Level freigeschaltet wurde.

## Version 110 – Cloud-Grundsystem (Teil 1)

- Google-Apps-Script-Anbindung über `assets/js/cloud-save.js`
- dauerhafte Geräte-ID pro Browser/Gerät
- Name, Gesamtpunktzahl, Gebietsfortschritt und Einzelpunktzahlen werden automatisch synchronisiert
- Speicherung wird nach Änderungen an Name, Punktestand oder Level-Fortschritt verzögert gebündelt
- Offline-Fallback: nicht übertragene Daten bleiben lokal vorgemerkt und werden bei erneuter Internetverbindung wieder gesendet
- lokale Highscore-Anzeige und lokale Speicherung bleiben vollständig erhalten

Verwendete Web-App:
`https://script.google.com/macros/s/AKfycbzJYTFZCbExoIkEHapupqHmhX7TP_sihY_SRssAgo-g1ruiXUYfvS6gGpTr5GBJNyW37g/exec`

## Version 111 – Teil 2: Online-Bestenliste und Adminbereich

- Die öffentliche Bestenliste auf der Weltkarte zeigt ausschließlich Name und Gesamt-Highscore von Spielern, die das Spiel abgeschlossen haben.
- Im Einstellungsmenü befindet sich der Button **„Zum Admin-Bereich“**.
- Admin-Passwort: `Mark123`
- `admin.html` zeigt Geräte-ID, Gebietsfortschritt, Gesamt-Highscore und alle Einzel-Level-Highscores.
- Nach vollständigem Spielabschluss weist ein goldener, schwebender Hinweis auf die Bestenliste.
- Der End-Highscore bleibt unter „Vielen Dank fürs Spielen“ sichtbar.

### Notwendige Apps-Script-Aktualisierung

Damit `admin.html` die vollständigen Online-Daten abrufen kann, muss der Inhalt aus `apps-script/Code.gs` in das Google-Apps-Script-Projekt übernommen und die bestehende Web-App als **neue Version** erneut bereitgestellt werden. Die `/exec`-Adresse bleibt normalerweise unverändert.
