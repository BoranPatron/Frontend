// Chart.js Error Handler Utility
// Diese Datei enthält Hilfsfunktionen zur Behandlung von Chart.js DOM-Fehlern

export const setupChartErrorHandling = () => {
  // Globale Fehlerbehandlung für Chart.js DOM-Fehler
  const originalConsoleError = console.error;
  
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    
    // Ignoriere spezifische Chart.js DOM-Fehler
    if (
      errorMessage.includes('Node.removeChild: The node to be removed is not a child of this node') ||
      errorMessage.includes('removeChild') ||
      errorMessage.includes('not a child of this node') ||
      errorMessage.includes('DOMException') ||
      errorMessage.includes('chart-vendor')
    ) {
      console.warn('Chart.js DOM cleanup error ignored:', errorMessage);
      return;
    }
    
    // Alle anderen Fehler normal loggen
    originalConsoleError.apply(console, args);
  };

  // Error Handler für unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || event.reason?.toString() || '';
    
    if (
      errorMessage.includes('Node.removeChild: The node to be removed is not a child of this node') ||
      errorMessage.includes('removeChild') ||
      errorMessage.includes('not a child of this node') ||
      errorMessage.includes('DOMException') ||
      errorMessage.includes('chart-vendor')
    ) {
      console.warn('Chart.js DOM cleanup error in promise rejection ignored:', errorMessage);
      event.preventDefault();
      return;
    }
  });

  // Error Handler für allgemeine Fehler
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || event.error?.message || '';
    
    if (
      errorMessage.includes('Node.removeChild: The node to be removed is not a child of this node') ||
      errorMessage.includes('removeChild') ||
      errorMessage.includes('not a child of this node') ||
      errorMessage.includes('DOMException') ||
      errorMessage.includes('chart-vendor')
    ) {
      console.warn('Chart.js DOM cleanup error in global error handler ignored:', errorMessage);
      event.preventDefault();
      return;
    }
  });

  // Zusätzliche DOM-Error-Behandlung für Production-Builds
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child: Node) {
    try {
      // Prüfe ob das Kind wirklich ein Kind dieses Knotens ist
      if (this.contains(child)) {
        return originalRemoveChild.call(this, child);
      } else {
        console.warn('Attempted to remove child that is not a child of this node - ignoring');
        return child;
      }
    } catch (error) {
      console.warn('Error in removeChild - ignoring:', error);
      return child;
    }
  };
};

// Chart.js Cleanup Utility
export const safeChartDestroy = (chart: any) => {
  if (!chart) return;
  
  try {
    // Prüfe ob Chart noch existiert und nicht bereits zerstört wurde
    if (chart.canvas && chart.canvas.parentNode) {
      chart.destroy();
    }
  } catch (error) {
    console.warn('Fehler beim Zerstören der Chart-Instanz:', error);
  }
};

// Chart.js Instance Manager
export class ChartInstanceManager {
  private charts: Map<string, any> = new Map();
  
  registerChart(id: string, chart: any) {
    // Zerstöre vorherige Instanz falls vorhanden
    this.destroyChart(id);
    this.charts.set(id, chart);
  }
  
  destroyChart(id: string) {
    const chart = this.charts.get(id);
    if (chart) {
      safeChartDestroy(chart);
      this.charts.delete(id);
    }
  }
  
  destroyAllCharts() {
    this.charts.forEach((chart, id) => {
      safeChartDestroy(chart);
    });
    this.charts.clear();
  }
  
  getChart(id: string) {
    return this.charts.get(id);
  }
}

// Globale Chart Instance Manager Instanz
export const globalChartManager = new ChartInstanceManager();
