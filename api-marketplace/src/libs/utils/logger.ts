interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  private level: number;

  constructor() {
    const envLevel = process.env.LOG_LEVEL || "info";
    this.level =
      LOG_LEVELS[envLevel.toUpperCase() as keyof LogLevel] || LOG_LEVELS.INFO;
  }

  private log(level: keyof LogLevel, message: string, ...args: any[]) {
    if (LOG_LEVELS[level] <= this.level) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${level}: ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    this.log("ERROR", message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log("WARN", message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log("INFO", message, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.log("DEBUG", message, ...args);
  }
}

export const logger = new Logger();
