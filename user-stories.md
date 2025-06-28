# Nostr Unchained - User Stories

## 📋 Übersicht

Diese User Stories beschreiben **alle Funktionen**, die ein Entwickler mit Nostr Unchained ausführen kann. Jede Story ist **atomar** und **klar verständlich** ohne technische Details.

---

## 🚀 **Kategorie 1: Initialisierung & Setup**

### US-001: Library initialisieren
**Als Entwickler** möchte ich die Library mit minimaler Konfiguration starten  
**Damit** ich sofort mit Nostr entwickeln kann

**Akzeptanzkriterien:**
- Ich kann die Library ohne Parameter starten
- Default-Relays werden automatisch verwendet
- Browser Extension (Alby) wird automatisch erkannt

### US-002: Eigene Relays konfigurieren
**Als Entwickler** möchte ich meine bevorzugten Relays angeben  
**Damit** meine App diese standardmäßig verwendet

**Akzeptanzkriterien:**
- Ich kann eine Liste von Relay-URLs übergeben
- Diese werden für alle Operationen als Standard verwendet
- Ungültige URLs werden automatisch gefiltert

---

## 💬 **Kategorie 2: Direct Messages**

### US-003: Einfache DM senden
**Als Entwickler** möchte ich eine DM mit einem Befehl senden  
**Damit** ich schnell Nachrichten verschicken kann

**Akzeptanzkriterien:**
- Ich gebe nur Empfänger-Pubkey und Nachricht an
- Empfänger-Relays werden automatisch ermittelt
- Nachricht wird verschlüsselt und gesendet

### US-004: DM mit expliziten Relays senden
**Als Entwickler** möchte ich bestimmte Relays für eine DM wählen  
**Damit** ich Kontrolle über die Übertragung habe

**Akzeptanzkriterien:**
- Ich kann spezifische Relays für eine Nachricht angeben
- Auto-Discovery wird übersprungen
- Fallback zu Standard-Relays ist optional

### US-005: DM-Unterhaltungen abrufen
**Als Entwickler** möchte ich alle Nachrichten mit einem Kontakt laden  
**Damit** ich Unterhaltungsverläufe anzeigen kann

**Akzeptanzkriterien:**
- Ich gebe einen Pubkey an und erhalte alle Nachrichten
- Nachrichten sind chronologisch sortiert
- Limit und Pagination sind möglich

### US-006: DM-Unterhaltungen live verfolgen
**Als Entwickler** möchte ich neue DMs automatisch erhalten  
**Damit** meine App in Echtzeit reagiert

**Akzeptanzkriterien:**
- Ich abonniere alle verschlüsselten DM-Events (an mich gerichtet)
- Events werden automatisch entschlüsselt und im Cache gespeichert
- Neue entschlüsselte Nachrichten werden automatisch geliefert
- Subscription kann jederzeit beendet werden

### US-007: Alle DM-Unterhaltungen auflisten
**Als Entwickler** möchte ich alle aktiven Unterhaltungen sehen  
**Damit** ich eine Übersicht erstellen kann

**Akzeptanzkriterien:**
- Ich erhalte eine Liste aller Gesprächspartner
- Letzte Nachricht und Zeitstempel sind enthalten
- Ungelesene Nachrichten werden markiert

---

## 🔍 **Kategorie 3: Event-Abfragen (Einfach)**

### US-008: Events nach Art filtern
**Als Entwickler** möchte ich Events nach Nostr-Kind filtern  
**Damit** ich nur relevante Event-Typen erhalte

**Akzeptanzkriterien:**
- Ich kann eine oder mehrere Kinds angeben
- Nur Events dieser Arten werden zurückgegeben
- Standard Nostr Kinds werden unterstützt

### US-009: Events nach Autor filtern
**Als Entwickler** möchte ich Events von bestimmten Personen laden  
**Damit** ich deren Aktivitäten verfolgen kann

**Akzeptanzkriterien:**
- Ich kann einen oder mehrere Pubkeys angeben
- Nur Events dieser Autoren werden zurückgegeben
- Ungültige Pubkeys werden ignoriert

### US-010: Events nach Zeitraum filtern
**Als Entwickler** möchte ich Events aus einem bestimmten Zeitraum laden  
**Damit** ich historische oder aktuelle Daten erhalte

**Akzeptanzkriterien:**
- Ich kann Start- und Endzeit angeben
- Events außerhalb des Zeitraums werden ausgeschlossen
- Zeitstempel werden korrekt interpretiert

### US-011: Events nach Tags filtern
**Als Entwickler** möchte ich Events mit bestimmten Tags finden  
**Damit** ich thematisch relevante Inhalte erhalte

**Akzeptanzkriterien:**
- Ich kann Tag-Namen und -Werte angeben
- Nur Events mit passenden Tags werden zurückgegeben
- Mehrere Tag-Filter können kombiniert werden

### US-012: Anzahl der Ergebnisse begrenzen
**Als Entwickler** möchte ich die Anzahl der zurückgegebenen Events limitieren  
**Damit** ich Performance und Speicher kontrolliere

**Akzeptanzkriterien:**
- Ich kann eine maximale Anzahl angeben
- Nur diese Anzahl Events wird zurückgegeben
- Neueste Events haben Priorität

---

## 🕸️ **Kategorie 4: Event-Abfragen (Komplex)**

### US-013: Alle Events zu einem Thema finden
**Als Entwickler** möchte ich alle Events finden, die mit einem Event zusammenhängen  
**Damit** ich komplette Diskussionen oder Threads laden kann

**Akzeptanzkriterien:**
- Ich gebe ein Start-Event an
- Alle referenzierenden Events werden gefunden
- Antworten und Reaktionen sind enthalten

### US-014: Event-Beziehungen analysieren
**Als Entwickler** möchte ich prüfen, ob ein Event bestimmte Beziehungen hat  
**Damit** ich den Status oder Kontext verstehe

**Akzeptanzkriterien:**
- Ich kann nach Child-Events bestimmter Art suchen
- Existenz-Prüfungen sind möglich
- Beziehungstypen werden korrekt erkannt

### US-015: Event-Graphen mit Tiefenbegrenzung durchsuchen
**Als Entwickler** möchte ich Event-Netzwerke mit kontrollierbarer Tiefe erkunden  
**Damit** ich nicht unendlich viele Events lade

**Akzeptanzkriterien:**
- Ich kann maximale Suchtiefe angeben
- Traversierung stoppt bei Erreichen der Grenze
- Verschiedene Traversierungsarten sind möglich

### US-016: Prüfen ob Event gelöscht wurde
**Als Entwickler** möchte ich feststellen, ob ein Event gelöscht wurde  
**Damit** ich gelöschte Inhalte entsprechend behandle

**Akzeptanzkriterien:**
- Ich kann nach Lösch-Events suchen
- Löschgrund wird ermittelt falls vorhanden
- Gültigkeit der Löschung wird geprüft

---

## 👤 **Kategorie 5: Profile-Management**

### US-017: Profil vollständig aktualisieren
**Als Entwickler** möchte ich alle Profil-Daten auf einmal setzen  
**Damit** ich komplette Profile erstellen kann

**Akzeptanzkriterien:**
- Ich kann Name, Beschreibung, Bild etc. angeben
- Alle Daten werden in einem Event gespeichert
- Ungültige Daten werden abgelehnt

### US-018: Einzelne Profil-Felder ändern
**Als Entwickler** möchte ich nur bestimmte Profil-Felder aktualisieren  
**Damit** ich effiziente Updates machen kann

**Akzeptanzkriterien:**
- Ich kann nur ein Feld angeben
- Andere Felder bleiben unverändert
- Intern wird ein vollständiges Profil-Event erstellt

### US-019: Profil einer Person laden
**Als Entwickler** möchte ich das Profil einer Person abrufen  
**Damit** ich deren Informationen anzeigen kann

**Akzeptanzkriterien:**
- Ich gebe einen Pubkey an
- Aktuellstes Profil wird zurückgegeben
- Fehlende Profile werden als null zurückgegeben

### US-020: Eigene Relay-Liste verwalten
**Als Entwickler** möchte ich meine eigene Relay-Liste aktualisieren  
**Damit** andere wissen, wo sie mich finden können

**Akzeptanzkriterien:**
- Ich kann meine Relays mit Lese/Schreib-Rechten angeben
- Liste wird als separates Event (NIP-65) gespeichert
- Ungültige Relay-URLs werden automatisch gefiltert

### US-021: Profil mit Relays kombiniert abrufen
**Als Entwickler** möchte ich Profil und Relays zusammen erhalten  
**Damit** ich alle Informationen auf einmal habe

**Akzeptanzkriterien:**
- Profil-Daten und Relay-Liste werden kombiniert
- Intern werden zwei separate Events abgefragt
- Fehlende Teile werden als leer zurückgegeben

---

## ⚡ **Kategorie 6: Event-Erstellung**

### US-022: Einfachen Text-Post erstellen
**Als Entwickler** möchte ich einen Text-Post mit einem Befehl erstellen  
**Damit** ich schnell Inhalte veröffentlichen kann

**Akzeptanzkriterien:**
- Ich gebe nur den Text-Inhalt an
- Event wird automatisch signiert
- Event wird an Standard-Relays gesendet

### US-023: Event mit Tags erstellen
**Als Entwickler** möchte ich Events mit Hashtags und Mentions versehen  
**Damit** ich strukturierte Inhalte erstelle

**Akzeptanzkriterien:**
- Ich kann beliebige Tags hinzufügen
- Tag-Format wird automatisch validiert
- Mehrere Tags desselben Typs sind möglich

### US-024: Antwort auf Event erstellen
**Als Entwickler** möchte ich auf ein bestehendes Event antworten  
**Damit** ich Diskussionen führen kann

**Akzeptanzkriterien:**
- Ich gebe das ursprüngliche Event an
- Korrekte Reply-Tags werden automatisch gesetzt
- Autor des ursprünglichen Events wird erwähnt

### US-025: Event an spezifische Relays senden
**Als Entwickler** möchte ich bestimmen, an welche Relays ein Event geht  
**Damit** ich Kontrolle über die Verbreitung habe

**Akzeptanzkriterien:**
- Ich kann Relay-Liste für ein Event angeben
- Standard-Relays werden übersprungen
- Fehlgeschlagene Relays werden gemeldet

### US-026: Spezielle Event-Arten erstellen
**Als Entwickler** möchte ich verschiedene Event-Arten erstellen können  
**Damit** ich unterschiedliche Inhaltstypen unterstütze

**Akzeptanzkriterien:**
- Ich kann beliebige Event-Kinds angeben
- Korrekte Tags für den Event-Typ werden gesetzt
- Event-Struktur wird automatisch validiert

---

## 🔐 **Kategorie 7: Signierung & Sicherheit**

### US-027: Mit Browser-Extension signieren
**Als Entwickler** möchte ich Events über Browser-Extensions signieren lassen  
**Damit** Private Keys sicher bleiben

**Akzeptanzkriterien:**
- Alby und andere NIP-07 Extensions werden erkannt
- Signierung erfolgt über Extension
- Fehlende Extensions werden elegant behandelt

### US-028: Mit privatem Schlüssel signieren
**Als Entwickler** möchte ich explizit mit einem privaten Schlüssel signieren  
**Damit** ich volle Kontrolle über die Signierung habe

**Akzeptanzkriterien:**
- Ich kann einen privaten Schlüssel angeben
- Signierung erfolgt lokal
- Schlüssel wird nicht gespeichert

### US-029: Event-Signaturen validieren
**Als Entwickler** möchte ich prüfen, ob Events gültig signiert sind  
**Damit** nur echte Events in den Cache kommen

**Akzeptanzkriterien:**
- Signatur wird automatisch bei jedem Event geprüft
- Ungültige Events werden verworfen (kommen nicht in Cache)
- Validierung erfolgt transparent im Hintergrund

---

## 🌐 **Kategorie 8: Relay-Management**

### US-030: Relays einer Person automatisch ermitteln
**Als Entwickler** möchte ich die bevorzugten Relays einer Person finden  
**Damit** ich optimal mit ihr kommuniziere

**Akzeptanzkriterien:**
- Relay-Liste wird aus deren Profil geladen
- Lese- und Schreib-Relays werden unterschieden
- Fallback zu Standard-Relays bei fehlenden Daten

### US-031: Relay-Listen kombinieren
**Als Entwickler** möchte ich mehrere Relay-Listen zusammenführen  
**Damit** ich optimale Relay-Auswahl treffe

**Akzeptanzkriterien:**
- Ich kann mehrere Listen angeben
- Duplikate werden automatisch entfernt
- Priorisierung ist möglich

### US-032: Relay-Verbindungsstatus prüfen
**Als Entwickler** möchte ich wissen, welche Relays erreichbar sind  
**Damit** ich nur funktionierende Relays verwende

**Akzeptanzkriterien:**
- Verbindungsstatus wird automatisch überwacht
- Ausgefallene Relays werden erkannt
- Status-Updates werden bereitgestellt

### US-033: Bei Relay-Fehlern benachrichtigt werden
**Als Entwickler** möchte ich über Relay-Probleme informiert werden  
**Damit** ich entsprechend reagieren kann

**Akzeptanzkriterien:**
- Verbindungsfehler werden gemeldet
- Fehlertyp und -details sind verfügbar
- Automatische Wiederverbindung ist möglich

---

## 📱 **Kategorie 9: Reactive Updates**

### US-034: Auf neue Events reagieren
**Als Entwickler** möchte ich automatisch über neue Events informiert werden  
**Damit** meine App in Echtzeit aktualisiert wird

**Akzeptanzkriterien:**
- Ich kann Event-Filter für Subscriptions angeben
- Neue passende Events werden automatisch geliefert
- Subscription kann jederzeit beendet werden

### US-035: Profil-Updates verfolgen
**Als Entwickler** möchte ich über Profil-Änderungen benachrichtigt werden  
**Damit** ich aktuelle Daten anzeige

**Akzeptanzkriterien:**
- Profil-Updates werden automatisch erkannt
- Geänderte Felder werden identifiziert
- Cache wird automatisch aktualisiert

### US-036: Store-Pattern für Svelte verwenden
**Als Entwickler** möchte ich Nostr-Daten als Svelte-Stores nutzen  
**Damit** meine UI automatisch reagiert

**Akzeptanzkriterien:**
- Stores sind Svelte-kompatibel
- Automatische Reaktivität funktioniert
- Manuelle Subscriptions sind möglich

---

## 🗄️ **Kategorie 10: Caching & Performance**

### US-037: Events automatisch cachen
**Als Entwickler** möchte ich, dass Events automatisch zwischengespeichert werden  
**Damit** wiederholte Abfragen schnell sind

**Akzeptanzkriterien:**
- Alle geladenen Events werden gecacht
- Cache wird automatisch verwaltet
- Veraltete Daten werden entfernt

### US-038: Cache-Status abfragen
**Als Entwickler** möchte ich wissen, was im Cache verfügbar ist  
**Damit** ich Cache-Treffer optimieren kann

**Akzeptanzkriterien:**
- Cache-Inhalt ist abfragbar
- Statistiken sind verfügbar
- Cache kann manuell geleert werden

### US-039: Offline-Daten nutzen
**Als Entwickler** möchte ich auch ohne Internet auf gecachte Daten zugreifen  
**Damit** meine App offline funktioniert

**Akzeptanzkriterien:**
- Gecachte Events sind offline verfügbar
- Offline-Status wird erkannt
- Sync erfolgt bei Wiederverbindung

---

## 🛠️ **Kategorie 11: Debugging & Entwicklung**

### US-040: Detaillierte Fehlerinformationen erhalten
**Als Entwickler** möchte ich aussagekräftige Fehlermeldungen bekommen  
**Damit** ich Probleme schnell lösen kann

**Akzeptanzkriterien:**
- Fehlertyp und -ursache sind klar
- Lösungsvorschläge werden bereitgestellt
- Technische Details sind verfügbar

### US-041: Debug-Modus aktivieren
**Als Entwickler** möchte ich ausführliche Logs aktivieren können  
**Damit** ich Probleme analysieren kann

**Akzeptanzkriterien:**
- Debug-Modus ist ein-/ausschaltbar
- Verschiedene Log-Level sind verfügbar
- Performance-Impact ist minimal

### US-042: Event-Struktur validieren
**Als Entwickler** möchte ich Events vor dem Senden prüfen lassen  
**Damit** ich ungültige Events vermeide

**Akzeptanzkriterien:**
- Struktur wird gegen Nostr-Standard geprüft
- Validierungsfehler werden detailliert gemeldet
- Ungültige Events werden beim Senden abgelehnt

---

## 📊 **Zusammenfassung**

**Gesamt: 42 User Stories**

- **Initialisierung**: 2 Stories
- **Direct Messages**: 5 Stories  
- **Einfache Abfragen**: 5 Stories
- **Komplexe Abfragen**: 4 Stories
- **Profile-Management**: 5 Stories
- **Event-Erstellung**: 5 Stories
- **Signierung**: 3 Stories
- **Relay-Management**: 4 Stories
- **Reactive Updates**: 3 Stories
- **Caching**: 3 Stories
- **Debugging**: 3 Stories

Jede Story ist **atomar**, **testbar** und **ohne technische Implementation-Details** beschrieben. 