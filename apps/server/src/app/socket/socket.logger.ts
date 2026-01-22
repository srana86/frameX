import { AuthenticatedSocket, SocketEventLog, SocketMetrics } from "../interface/socket.types";

/**
 * Socket event logger
 * Logs structured events for observability
 * Tracks slow events (>100ms) for performance monitoring
 */
class SocketLogger {
  private logs: SocketEventLog[] = [];
  private readonly MAX_LOGS = 1000; // Keep last 1000 logs in memory
  private readonly SLOW_EVENT_THRESHOLD = 100; // 100ms

  logEvent(
    event: string,
    socket: AuthenticatedSocket,
    duration: number,
    error?: string
  ): void {
    const log: SocketEventLog = {
      event,
      socketId: socket.id,
      userId: socket.userId,
      duration,
      timestamp: new Date(),
      error,
    };

    // Add to logs (keep only last MAX_LOGS)
    this.logs.push(log);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // Log to console with structured format
    const logLevel = error
      ? "ERROR"
      : duration > this.SLOW_EVENT_THRESHOLD
        ? "WARN"
        : "INFO";
    const logMessage = {
      level: logLevel,
      event: log.event,
      socketId: log.socketId,
      userId: log.userId,
      duration: `${log.duration}ms`,
      timestamp: log.timestamp.toISOString(),
      ...(error && { error }),
    };

    console.log(JSON.stringify(logMessage));

    // In production, send to logging service (e.g., Winston, Pino, DataDog)
  }

  /**
   * Get slow events (>100ms)
   */
  getSlowEvents(): SocketEventLog[] {
    return this.logs.filter((log) => log.duration > this.SLOW_EVENT_THRESHOLD);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100): SocketEventLog[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by event name
   */
  getLogsByEvent(event: string): SocketEventLog[] {
    return this.logs.filter((log) => log.event === event);
  }

  /**
   * Clear logs (useful for testing)
   */
  clear(): void {
    this.logs = [];
  }
}

/**
 * Socket metrics collector
 */
class SocketMetricsCollector {
  private metrics: SocketMetrics = {
    connections: 0,
    eventsEmitted: 0,
    eventsReceived: 0,
    errors: 0,
    slowEvents: 0,
  };

  incrementConnections(): void {
    this.metrics.connections++;
  }

  decrementConnections(): void {
    this.metrics.connections = Math.max(0, this.metrics.connections - 1);
  }

  incrementEventsEmitted(): void {
    this.metrics.eventsEmitted++;
  }

  incrementEventsReceived(): void {
    this.metrics.eventsReceived++;
  }

  incrementErrors(): void {
    this.metrics.errors++;
  }

  incrementSlowEvents(): void {
    this.metrics.slowEvents++;
  }

  getMetrics(): SocketMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      connections: 0,
      eventsEmitted: 0,
      eventsReceived: 0,
      errors: 0,
      slowEvents: 0,
    };
  }
}

export const socketLogger = new SocketLogger();
export const socketMetrics = new SocketMetricsCollector();
