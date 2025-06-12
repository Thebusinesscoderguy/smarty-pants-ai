
export interface ConnectionDiagnostics {
  environment: 'editor' | 'preview' | 'standalone' | 'unknown';
  userAgent: string;
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export interface TimingMetrics {
  dnsLookup: number;
  tcpConnect: number;
  sslHandshake: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  total: number;
}

export class ConnectionDiagnostics {
  static detectEnvironment(): ConnectionDiagnostics['environment'] {
    if (typeof window === 'undefined') return 'unknown';
    
    const url = window.location.href;
    const userAgent = navigator.userAgent;
    
    // Check for Lovable editor environment
    if (url.includes('lovable.app') && window.parent !== window) {
      return 'editor';
    }
    
    // Check for standalone preview
    if (url.includes('preview--') || url.includes('lovable.app')) {
      return 'preview';
    }
    
    // Check for custom domain or localhost
    if (url.includes('localhost') || !url.includes('lovable')) {
      return 'standalone';
    }
    
    return 'unknown';
  }

  static getConnectionInfo(): ConnectionDiagnostics {
    const environment = this.detectEnvironment();
    
    const diagnostics: ConnectionDiagnostics = {
      environment,
      userAgent: navigator.userAgent,
      isOnline: navigator.onLine,
    };

    // Add network information if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      diagnostics.connectionType = connection?.type;
      diagnostics.effectiveType = connection?.effectiveType;
      diagnostics.downlink = connection?.downlink;
      diagnostics.rtt = connection?.rtt;
    }

    return diagnostics;
  }

  static getRecommendedTimeout(environment: ConnectionDiagnostics['environment'], baseTimeout: number = 8000): number {
    switch (environment) {
      case 'editor':
        return baseTimeout * 0.75; // 25% faster for editor
      case 'preview':
        return baseTimeout * 3; // 200% slower for preview (was 2x, now 3x)
      case 'standalone':
        return baseTimeout * 1.5; // 50% slower for standalone
      default:
        return baseTimeout;
    }
  }

  static async measureConnectionTiming(url: string): Promise<Partial<TimingMetrics>> {
    if (!('performance' in window) || !performance.getEntriesByType) {
      return {};
    }

    const startTime = performance.now();
    
    try {
      // Clear previous measurements
      performance.clearResourceTimings();
      
      // Make a simple request to measure timing
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'cors' // Explicitly set CORS mode for cross-origin requests
      });
      
      const endTime = performance.now();
      const total = endTime - startTime;
      
      // Try to get detailed timing if available
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const entry = entries.find(e => e.name.includes(new URL(url).hostname));
      
      if (entry) {
        return {
          dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
          tcpConnect: entry.connectEnd - entry.connectStart,
          sslHandshake: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
          requestStart: entry.requestStart - entry.connectEnd,
          responseStart: entry.responseStart - entry.requestStart,
          responseEnd: entry.responseEnd - entry.responseStart,
          total
        };
      }
      
      return { total };
    } catch (error) {
      return { total: performance.now() - startTime };
    }
  }

  static logDiagnostics(diagnostics: ConnectionDiagnostics, timing?: Partial<TimingMetrics>) {
    console.log('🔍 Connection Diagnostics:', {
      environment: diagnostics.environment,
      online: diagnostics.isOnline,
      connection: {
        type: diagnostics.connectionType,
        effectiveType: diagnostics.effectiveType,
        downlink: diagnostics.downlink,
        rtt: diagnostics.rtt
      },
      timing,
      userAgent: diagnostics.userAgent.substring(0, 100) + '...'
    });
  }

  static async testBasicConnectivity(): Promise<boolean> {
    try {
      // Test basic internet connectivity first
      const response = await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.warn('Basic connectivity test failed:', error);
      return false;
    }
  }
}
