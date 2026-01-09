# QUAKE IT

**IM3 Projekt von James Richter**

## Kurzbeschreibung des Projekts

**[QUAKEIT](https://im3.jamesrichter.ch)** ist ein spielerisch-absurdes Webprojekt, das Erdbeben mit Musik verbindet. Für jedes registrierte Erdbeben wird eine Playlist generiert, basierend auf dem Radioprogramm von SRF 1 zum Zeitpunkt des Bebens. Die Magnitude bestimmt die Länge der Playlist, das Timing die Dramaturgie. Das Projekt kombiniert Echtzeitdaten der USGS mit Radiodaten und macht sichtbar, was gehört wurde, als die Erde bebte.

---

## Gruppenmitglieder

James Richter 24C2 (james.richter@stud.fhgr.ch)

---

## Learnings und Schwierigkeiten

- Umgang mit Datenbanken und phpMyAdmin anfangs anspruchsvoll. Besonders Tabellenstrukturen, Relationen und Datentypen waren verwirrend. Durch wiederholtes Testen von SQL-Queries und gezieltes Überprüfen einzelner Datensätze wurden Zusammenhänge klar.

- Weiters Learning: Umgang mit unvollständigen oder noch wachsenden Datensätzen. Das Taylor-Swift-Diagramm konnte zum Zeitpunkt der Abgabe noch nicht mit aussagekräftigen Echtzeitdaten arbeiten (wegen der Nicht-Rückverfolgbarkeit der SRF Daten), was zeigt, wie abhängig visuelle Auswertungen von genügend grosser Datenmengen sind und dass man in solche Fälle Übergangslösungen (Dummy-Data) einplanen muss.

- Zudem habe ich wieder einmal unterschätzt, wie viel Aufwand das Coden eines "überstylten" Figmas mit sich bringt. Elemente, die im Design schnell gemacht sind, brauchen im Code viel Feinarbeit und iterative Anpassungen über verschiedene Screen-Grössen hinweg.

Alles in allem hat mir das Projekt geholfen, ein tieferes Verständnis für die Komplexität zwischen Design, Daten/Datenbanken und technischer Umsetzung zu entwickeln. Geduld und strukturiertes Debugging im Entwicklungsprozess sind essenziell.

## Benutzte Ressourcen und Prompts
- API Erdbeben: https://www.freepublicapis.com/earthquake-catalog-api
- API SRF1: https://www.freepublicapis.com/radio-srf-1
- Für das Projekt wurde ausschliesslich ChatGPT verwendet.

### Prompt aus der Layout-Überarbeitung:
"mir gefällt nicht, wie songtitel und artist plötzlich untereinander stehen wenn der name oder titel zu lang ist. ich denke, es wäre cleaner, wenn sie nebeneinander bleiben und bei langen namen einfach mit dem ellipsis cut-off abgeschnitten werden. wie mache ich das nochmal?”

### Prompt aus der Arbeit am Storytelling:
"die time stamps der songs wirken komisch, wenn das erdbeben zeitlich nicht genau mit den songs übereinstimmt. vielleicht ist es besser, die exakten zeiten ganz wegzulassen, damit die story stimmiger bleibt?"

### Prompt zu ETL-Imports:
"mir ist aufgefallen, dass nach dem etl-run weniger erdbeben in der datenbank sind als vorher. liegt das an der usgs-api oder an der importlogik?"