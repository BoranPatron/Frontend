import React, { useState } from 'react';
import OnboardingOverlay from '../components/OnboardingOverlay';
import { useOnboarding } from '../hooks/useOnboarding';

const OnboardingDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [demoUserType, setDemoUserType] = useState<'beta' | 'new'>('beta');
  
  const {
    showOnboarding,
    userType,
    startOnboarding,
    completeOnboarding,
    skipOnboarding
  } = useOnboarding();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            BuildWise Onboarding Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Interaktive Demonstration des modernen Onboarding-Overlays für Beta-User und neue Benutzer
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Demo-Kontrollen
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* User Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                User-Typ
              </label>
              <select
                value={demoUserType}
                onChange={(e) => setDemoUserType(e.target.value as 'beta' | 'new')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="beta">Beta-User</option>
                <option value="new">Neuer User</option>
              </select>
            </div>

            {/* Start Demo */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Demo starten
              </label>
              <button
                onClick={() => setShowDemo(true)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Onboarding starten
              </button>
            </div>

            {/* Reset Demo */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Demo zurücksetzen
              </label>
              <button
                onClick={() => setShowDemo(false)}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Zurücksetzen
              </button>
            </div>

            {/* Current Status */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                {showDemo ? 'Aktiv' : 'Inaktiv'}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Beta User Features */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
              Beta-User Features
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                Tägliches Onboarding (einmal pro Tag)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                Zusätzliche Beta-Feature-Schritte
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                Feedback-Integration
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                Erweiterte Statistiken
              </li>
            </ul>
          </div>

          {/* New User Features */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              Neuer User Features
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Einmaliges Onboarding
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Grundlegende Plattform-Einführung
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Rollenbasierte Anleitung
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Persistente Speicherung
              </li>
            </ul>
          </div>
        </div>

        {/* Technical Features */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Technische Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Element-Hervorhebung</h3>
              <p className="text-gray-600 text-sm">
                Interaktive Hervorhebung von UI-Elementen mit animierten Rändern
              </p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Responsive Design</h3>
              <p className="text-gray-600 text-sm">
                Optimiert für alle Geräte und Bildschirmgrößen
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">💾</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Persistente Speicherung</h3>
              <p className="text-gray-600 text-sm">
                Intelligente Speicherung des Onboarding-Status pro User
              </p>
            </div>
          </div>
        </div>

        {/* Mock UI Elements for Demo */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Mock UI für Demo
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mock Navbar */}
            <nav 
              data-testid="navbar"
              className="bg-gray-800 text-white p-4 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="font-bold">BuildWise</span>
                  <span className="text-sm">Dashboard</span>
                  <span className="text-sm">Projekte</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🔔</span>
                  <span className="text-sm">👤</span>
                </div>
              </div>
            </nav>

            {/* Mock Dashboard */}
            <div 
              data-testid="dashboard"
              className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200"
            >
              <h3 className="font-semibold text-blue-900 mb-2">Dashboard</h3>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded text-sm">📊 Statistiken</div>
                <div className="bg-white p-2 rounded text-sm">📈 Aktivitäten</div>
                <div className="bg-white p-2 rounded text-sm">⚡ Schnellzugriff</div>
              </div>
            </div>

            {/* Mock Projects */}
            <div 
              data-testid="projects-section"
              className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200"
            >
              <h3 className="font-semibold text-orange-900 mb-2">Projekte</h3>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded text-sm">🏗️ Projekt A</div>
                <div className="bg-white p-2 rounded text-sm">🏗️ Projekt B</div>
                <div className="bg-white p-2 rounded text-sm">➕ Neues Projekt</div>
              </div>
            </div>

            {/* Mock Messages */}
            <div 
              data-testid="messages-section"
              className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200"
            >
              <h3 className="font-semibold text-purple-900 mb-2">Nachrichten</h3>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded text-sm">💬 Chat</div>
                <div className="bg-white p-2 rounded text-sm">📅 Termine</div>
                <div className="bg-white p-2 rounded text-sm">🔔 Benachrichtigungen</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {/* Mock Finance */}
            <div 
              data-testid="finance-section"
              className="bg-green-50 p-4 rounded-lg border-2 border-green-200"
            >
              <h3 className="font-semibold text-green-900 mb-2">Finanzen</h3>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded text-sm">💰 Rechnungen</div>
                <div className="bg-white p-2 rounded text-sm">📊 Berichte</div>
                <div className="bg-white p-2 rounded text-sm">💳 Zahlungen</div>
              </div>
            </div>

            {/* Mock Tasks */}
            <div 
              data-testid="tasks-section"
              className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200"
            >
              <h3 className="font-semibold text-blue-900 mb-2">Aufgaben</h3>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded text-sm">✅ Aufgabe 1</div>
                <div className="bg-white p-2 rounded text-sm">⏳ Aufgabe 2</div>
                <div className="bg-white p-2 rounded text-sm">📅 Zeitplan</div>
              </div>
            </div>

            {/* Mock Geo Search */}
            <div 
              data-testid="geo-search"
              className="bg-red-50 p-4 rounded-lg border-2 border-red-200"
            >
              <h3 className="font-semibold text-red-900 mb-2">Geo-Suche</h3>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded text-sm">🗺️ Karte</div>
                <div className="bg-white p-2 rounded text-sm">🔍 Suche</div>
                <div className="bg-white p-2 rounded text-sm">👥 Dienstleister</div>
              </div>
            </div>

            {/* Mock Favorites */}
            <div 
              data-testid="favorites"
              className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200"
            >
              <h3 className="font-semibold text-yellow-900 mb-2">Favoriten</h3>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded text-sm">⭐ Favorit 1</div>
                <div className="bg-white p-2 rounded text-sm">⭐ Favorit 2</div>
                <div className="bg-white p-2 rounded text-sm">➕ Hinzufügen</div>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Overlay */}
        {showDemo && (
          <OnboardingOverlay
            isVisible={showDemo}
            onComplete={() => {
              setShowDemo(false);
              alert('Onboarding erfolgreich abgeschlossen!');
            }}
            onSkip={() => {
              setShowDemo(false);
              alert('Onboarding übersprungen!');
            }}
            userType={demoUserType}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingDemo;