// Copied from src/utils/logger.ts
const logger = {
  debug: (...args: any[]) => {
    if ((window as any).electronLog) {
      (window as any).electronLog.debug(...args);
    } else {
      console.debug(...args);
    }
  },
  info: (...args: any[]) => {
    if ((window as any).electronLog) {
      (window as any).electronLog.info(...args);
    } else {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if ((window as any).electronLog) {
      (window as any).electronLog.warn(...args);
    } else {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    if ((window as any).electronLog) {
      (window as any).electronLog.error(...args);
    } else {
      console.error(...args);
    }
  }
};

export default logger;
