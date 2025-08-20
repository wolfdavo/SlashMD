/**
 * Telemetry Service for Phase 4: Commands, Settings & Asset Management
 * 
 * This service provides:
 * - Anonymous usage analytics (opt-in only)
 * - Error reporting and crash analytics
 * - Performance metrics collection
 * - User experience insights
 */

import * as vscode from 'vscode';

export interface TelemetryEvent {
  /** Event name */
  name: string;
  /** Event properties */
  properties?: Record<string, any>;
  /** Event measurements */
  measurements?: Record<string, number>;
  /** Timestamp */
  timestamp: number;
}

export interface ErrorEvent extends TelemetryEvent {
  name: 'error';
  properties: {
    error: string;
    stack?: string;
    context?: string;
    recoverable: boolean;
    userAgent: string;
    extensionVersion: string;
  };
}

export class TelemetryService {
  private enabled = false;
  private readonly events: TelemetryEvent[] = [];
  private readonly maxEvents = 100;
  
  constructor(private readonly context: vscode.ExtensionContext) {
    this.initializeTelemetry();
  }

  /**
   * Initialize telemetry service
   */
  private initializeTelemetry(): void {
    // Check if telemetry is enabled in VS Code settings
    const telemetryConfig = vscode.workspace.getConfiguration('telemetry');
    this.enabled = telemetryConfig.get('enableTelemetry', false);
    
    if (this.enabled) {
      console.log('[TelemetryService] Telemetry enabled');
      this.trackEvent('extension_activated', {
        version: this.getExtensionVersion(),
        platform: process.platform,
        nodeVersion: process.version
      });
    } else {
      console.log('[TelemetryService] Telemetry disabled');
    }
    
    // Listen for setting changes
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('telemetry')) {
        const newEnabled = vscode.workspace.getConfiguration('telemetry').get('enableTelemetry', false);
        if (newEnabled !== this.enabled) {
          this.enabled = newEnabled;
          console.log('[TelemetryService] Telemetry', this.enabled ? 'enabled' : 'disabled');
        }
      }
    });
  }

  /**
   * Track a general event
   */
  trackEvent(name: string, properties?: Record<string, any>, measurements?: Record<string, number>): void {
    if (!this.enabled) return;

    const event: TelemetryEvent = {
      name,
      properties: {
        ...properties,
        timestamp: Date.now(),
        session: this.getSessionId()
      },
      measurements,
      timestamp: Date.now()
    };

    this.addEvent(event);
    console.log('[TelemetryService] Event tracked:', name, properties);
  }

  /**
   * Track an error event
   */
  trackError(error: Error | string, context?: string, recoverable: boolean = true): void {
    if (!this.enabled) return;

    const errorEvent: ErrorEvent = {
      name: 'error',
      properties: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context,
        recoverable,
        userAgent: this.getUserAgent(),
        extensionVersion: this.getExtensionVersion()
      },
      timestamp: Date.now()
    };

    this.addEvent(errorEvent);
    console.log('[TelemetryService] Error tracked:', errorEvent.properties.error);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(operation: string, duration: number, success: boolean): void {
    if (!this.enabled) return;

    this.trackEvent('performance', {
      operation,
      success
    }, {
      duration
    });
  }

  /**
   * Track user action
   */
  trackUserAction(action: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    this.trackEvent('user_action', {
      action,
      ...properties
    });
  }

  /**
   * Track extension usage
   */
  trackUsage(feature: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    this.trackEvent('feature_usage', {
      feature,
      ...properties
    });
  }

  /**
   * Get telemetry statistics
   */
  getStats(): {
    enabled: boolean;
    eventsCollected: number;
    errorCount: number;
    lastEvent: TelemetryEvent | null;
  } {
    const errorCount = this.events.filter(e => e.name === 'error').length;
    const lastEvent = this.events[this.events.length - 1] || null;

    return {
      enabled: this.enabled,
      eventsCollected: this.events.length,
      errorCount,
      lastEvent
    };
  }

  /**
   * Export telemetry data for debugging
   */
  exportData(): TelemetryEvent[] {
    if (!this.enabled) {
      return [];
    }
    
    return this.events.map(event => ({
      ...event,
      // Remove sensitive data
      properties: event.properties ? {
        ...event.properties,
        // Remove any potential PII
        stack: event.properties.stack ? '[REDACTED]' : undefined
      } : undefined
    }));
  }

  /**
   * Clear collected telemetry data
   */
  clearData(): void {
    this.events.length = 0;
    console.log('[TelemetryService] Telemetry data cleared');
  }

  /**
   * Add event to collection
   */
  private addEvent(event: TelemetryEvent): void {
    this.events.push(event);
    
    // Limit event storage
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
  }

  /**
   * Get extension version
   */
  private getExtensionVersion(): string {
    const extension = vscode.extensions.getExtension('slashmd.slashmd');
    return extension?.packageJSON.version || '0.0.1';
  }

  /**
   * Get user agent string
   */
  private getUserAgent(): string {
    return `SlashMD/${this.getExtensionVersion()} VSCode/${vscode.version} ${process.platform}`;
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    let sessionId = this.context.globalState.get<string>('sessionId');
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.context.globalState.update('sessionId', sessionId);
    }
    
    return sessionId;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.enabled) {
      this.trackEvent('extension_deactivated', {
        sessionDuration: Date.now() - (this.events[0]?.timestamp || Date.now())
      });
    }
    
    this.clearData();
    console.log('[TelemetryService] Disposed');
  }
}