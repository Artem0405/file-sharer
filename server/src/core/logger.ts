// server/src/core/logger.ts
import pino from 'pino';

// Настраиваем логгер
export const logger = pino({
  // В режиме разработки используем pino-pretty для красивого вывода
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});