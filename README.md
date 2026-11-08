# 🌿 Gartenbistro Kasse (iPad Web-App)

Eine einfache, schnelle und **100% offline-fähige** Kassen-App (PWA) für das iPad — entwickelt für das Gartenbistro.

## ✨ Funktionen

1. **🛒 Kasse (Checkout)**
   - **Grosse, farbcodierte Tasten** mit Kategorien (*Kaffee & Warmes*, *Kaltgetränke*, *Kuchen & Süsses*, *Herzhaftes* usw.) für schnelles Antippen auf dem iPad.
   - **＋ Freier Betrag**: Spontane Beträge oder Spezialwünsche jederzeit direkt eintippen.
   - **💵 Integrierter Rückgeld-Rechner**: Einfach auf `+ 5`, `+ 10`, `+ 20`, `+ 50`, `+ 100`, `+ 200` oder `Passend` tippen — das Rückgeld wird sofort gross angezeigt.
   - **Zahlungsarten**: Unterscheidung zwischen **Bar** und **TWINT / Karte**, damit am Abend die Bargeldkasse auf den Rappen genau stimmt.
   - **Sofort-Storno**: Falls man sich vertippt hat, kann die letzte Bestellung direkt mit einem Fingertipp rückgängig gemacht werden.

2. **📊 Tagesumsatz & Statistik**
   - Übersicht über **Gesamtumsatz**, **Bargeld-Bestand**, **TWINT/Karten-Umsatz** und **verkaufte Stückzahlen**.
   - **Rangliste der verkauften Artikel** (wie viele Kuchen, Kaffees usw. wurden heute verkauft?).
   - **Chronologischer Bestellverlauf** mit Storno-Funktion für einzelne Bestellungen.
   - **📥 CSV-Export** (für Excel / Apple Numbers) & **🖨️ Drucken / PDF-Bericht** (über AirPrint auf dem iPad).
   - **🗑️ Tag abschliessen**: Setzt den Tagesumsatz für den nächsten Tag auf Null zurück (das Sortiment bleibt erhalten).

3. **✏️ Sortiment direkt auf dem iPad bearbeiten (ohne Programmierkenntnisse)**
   - Neue Artikel hinzufügen, Preise ändern, Farben & Symbole (Emojis) auswählen.
   - Artikel per Pfeiltasten umsortieren oder vorübergehend **ausblenden** (z.B. wenn ein Kuchen ausverkauft ist).
   - Eigene Kategorien erstellen oder löschen.
   - **💾 Backup-Funktion**: Sortiment als `.json`-Datei sichern und jederzeit wiederherstellen.

---

## 📱 Einrichtung auf dem iPad (Als Vollbild-App)

1. Webseite im **Safari-Browser** auf dem iPad öffnen.
2. Oben rechts auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben) tippen.
3. Auf **«Zum Home-Bildschirm»** (*Add to Home Screen*) tippen.
4. Jetzt erscheint **«Bistro Kasse»** als echtes App-Icon auf dem iPad, startet im Vollbildmodus (ohne Browser-Leiste) und funktioniert **auch ohne Internetverbindung** im Garten!

---

## 🚀 Lokal starten oder kostenlos hosten

Da die App komplett ohne komplexe Server oder Datenbanken auskommt, kann sie:
- **Kostenlos auf GitHub Pages, Netlify oder Cloudflare Pages** gehostet werden (einfach diesen Ordner hochladen).
- **Lokal getestet werden**:
  ```bash
  python3 -m http.server 8080
  ```
  Danach im Browser `http://localhost:8080` öffnen.
