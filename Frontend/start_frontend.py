#!/usr/bin/env python3
"""
Nachhaltiges Frontend-Start-Skript für BuildWise
Behebt häufige Probleme und bietet bessere Fehlerbehandlung
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_node_modules():
    """Überprüft ob node_modules existiert"""
    node_modules_path = Path("node_modules")
    if not node_modules_path.exists():
        print("📦 node_modules nicht gefunden. Installiere Abhängigkeiten...")
        subprocess.run(["npm", "install"], check=True)
        return True
    return True

def check_package_json():
    """Überprüft ob package.json existiert"""
    package_json_path = Path("package.json")
    if not package_json_path.exists():
        print("❌ package.json nicht gefunden!")
        return False
    return True

def check_backend_connection():
    """Überprüft ob das Backend erreichbar ist"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend erreichbar")
            return True
    except requests.exceptions.RequestException:
        print("⚠️  Backend nicht erreichbar. Stelle sicher, dass es läuft.")
        return False

def start_frontend():
    """Startet das Frontend mit korrekten Parametern"""
    print("🚀 Starte BuildWise Frontend...")
    
    # Überprüfe ob wir im richtigen Verzeichnis sind
    if not Path("package.json").exists():
        print("❌ package.json nicht gefunden!")
        print("💡 Stelle sicher, dass du im Frontend-Verzeichnis bist")
        return False
    
    # Starte den Development-Server
    try:
        cmd = ["npm", "run", "dev"]
        print(f"🔧 Starte mit: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend-Start fehlgeschlagen: {e}")
        return False
    except KeyboardInterrupt:
        print("\n👋 Frontend gestoppt")
        return True

def main():
    """Hauptfunktion mit nachhaltiger Fehlerbehandlung"""
    print("🎨 BuildWise Frontend - Nachhaltiger Start")
    print("=" * 50)
    
    # 1. package.json prüfen
    print("📋 Prüfe package.json...")
    if not check_package_json():
        print("❌ package.json nicht gefunden")
        return 1
    
    # 2. node_modules prüfen
    print("📦 Prüfe node_modules...")
    if not check_node_modules():
        print("❌ node_modules konnten nicht installiert werden")
        return 1
    
    # 3. Backend-Verbindung prüfen (optional)
    print("🔗 Prüfe Backend-Verbindung...")
    check_backend_connection()
    
    # 4. Frontend starten
    print("🚀 Starte Frontend...")
    if start_frontend():
        print("✅ Frontend erfolgreich gestartet")
        return 0
    else:
        print("❌ Frontend-Start fehlgeschlagen")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 