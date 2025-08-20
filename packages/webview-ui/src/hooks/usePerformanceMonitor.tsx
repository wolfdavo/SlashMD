/**
 * Performance monitoring hook for Phase 4
 * Tracks typing latency, render performance, and memory usage
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  keystrokeLatency: number[];
  averageLatency: number;
  renderTime: number;
  memoryUsage?: number;
  blockCount: number;
  lastUpdate: number;
}

interface PerformanceMonitorOptions {
  enabled?: boolean;
  maxSamples?: number;
  onLatencyThreshold?: (latency: number) => void;
  thresholdMs?: number;
}

export const usePerformanceMonitor = (
  blockCount: number,
  options: PerformanceMonitorOptions = {}
) => {
  const {
    enabled = true,
    maxSamples = 100,
    onLatencyThreshold,
    thresholdMs = 16 // 16ms = 60fps
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    keystrokeLatency: [],
    averageLatency: 0,
    renderTime: 0,
    blockCount: 0,
    lastUpdate: Date.now()
  });

  const lastKeystrokeTime = useRef<number>(0);
  const renderStartTime = useRef<number>(0);
  const observer = useRef<PerformanceObserver | null>(null);

  // Measure keystroke latency
  const measureKeystrokeLatency = useCallback(() => {
    if (!enabled) return;

    const currentTime = performance.now();
    const latency = currentTime - lastKeystrokeTime.current;

    if (lastKeystrokeTime.current > 0 && latency > 0 && latency < 1000) {
      setMetrics(prev => {
        const newLatencies = [...prev.keystrokeLatency, latency];
        
        // Keep only the last maxSamples
        if (newLatencies.length > maxSamples) {
          newLatencies.shift();
        }

        const averageLatency = newLatencies.reduce((sum, l) => sum + l, 0) / newLatencies.length;

        // Trigger threshold callback if needed
        if (onLatencyThreshold && latency > thresholdMs) {
          onLatencyThreshold(latency);
        }

        return {
          ...prev,
          keystrokeLatency: newLatencies,
          averageLatency,
          lastUpdate: Date.now()
        };
      });
    }

    lastKeystrokeTime.current = currentTime;
  }, [enabled, maxSamples, onLatencyThreshold, thresholdMs]);

  // Start render measurement
  const startRenderMeasurement = useCallback(() => {
    if (!enabled) return;
    renderStartTime.current = performance.now();
  }, [enabled]);

  // End render measurement
  const endRenderMeasurement = useCallback(() => {
    if (!enabled || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({
      ...prev,
      renderTime,
      blockCount,
      lastUpdate: Date.now()
    }));

    renderStartTime.current = 0;
  }, [enabled, blockCount]);

  // Measure memory usage (if available)
  const measureMemoryUsage = useCallback(() => {
    if (!enabled) return;

    // @ts-ignore - performance.memory is non-standard but widely supported
    if (performance.memory) {
      // @ts-ignore
      const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      setMetrics(prev => ({
        ...prev,
        memoryUsage,
        lastUpdate: Date.now()
      }));
    }
  }, [enabled]);

  // Set up Performance Observer for more detailed metrics
  useEffect(() => {
    if (!enabled) return;

    if ('PerformanceObserver' in window) {
      observer.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.startsWith('React')) {
            // Track React render performance
            setMetrics(prev => ({
              ...prev,
              renderTime: entry.duration,
              lastUpdate: Date.now()
            }));
          }
        }
      });

      try {
        observer.current.observe({ entryTypes: ['measure'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported:', e);
      }
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [enabled]);

  // Periodic memory measurement
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(measureMemoryUsage, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [enabled, measureMemoryUsage]);

  // Performance warning system
  const getPerformanceStatus = useCallback((): 'good' | 'warning' | 'critical' => {
    if (metrics.averageLatency === 0) return 'good';
    
    if (metrics.averageLatency > 50) return 'critical';
    if (metrics.averageLatency > 25) return 'warning';
    return 'good';
  }, [metrics.averageLatency]);

  // Get recommendations based on current performance
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    
    if (metrics.averageLatency > 30) {
      recommendations.push('High typing latency detected. Consider reducing block count or enabling virtualization.');
    }
    
    if (metrics.memoryUsage && metrics.memoryUsage > 100) {
      recommendations.push('High memory usage detected. Consider optimizing block rendering.');
    }
    
    if (metrics.blockCount > 500) {
      recommendations.push('Large document detected. Consider enabling virtual scrolling.');
    }
    
    return recommendations;
  }, [metrics]);

  // Export metrics for debugging
  const exportMetrics = useCallback(() => {
    return {
      ...metrics,
      status: getPerformanceStatus(),
      recommendations: getRecommendations(),
      timestamp: new Date().toISOString()
    };
  }, [metrics, getPerformanceStatus, getRecommendations]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      keystrokeLatency: [],
      averageLatency: 0,
      renderTime: 0,
      blockCount: 0,
      lastUpdate: Date.now()
    });
  }, []);

  return {
    metrics,
    measureKeystrokeLatency,
    startRenderMeasurement,
    endRenderMeasurement,
    getPerformanceStatus,
    getRecommendations,
    exportMetrics,
    resetMetrics,
    enabled
  };
};