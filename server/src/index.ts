// server/src/index.ts

import express, { Request, Response, NextFunction } from 'express'; // Добавили типы
import cors from 'cors';
import { config } from './core/config';
import { logger } from './core/logger';
import { setupDatabase } from './core/database';
import { filesRouter } from './api/files.controller';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/files', filesRouter);

// --- ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК ---
// ВАЖНО: Он должен идти после всех роутеров.
// Express понимает, что это обработчик ошибок, по наличию 4 аргументов (err, req, res, next).
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Логируем полную ошибку на сервере для отладки
  logger.error(err);

  // Проверяем, была ли ошибка от multer (например, неверный тип файла)
  if (err.message === 'Invalid file type.') {
    return res.status(400).json({ error: 'Invalid file type.' });
  }

  // Проверяем ошибку multer на слишком большой файл
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File is too large. Max size is 10MB.' });
  }

  // Для всех остальных неожиданных ошибок отправляем общую ошибку 500
  // Не отправляем детали ошибки клиенту из соображений безопасности
  return res.status(500).json({ error: 'Internal Server Error' });
});

// --- Запуск сервера ---
async function startServer() {
  // ... (остальной код без изменений)
  await setupDatabase();
  app.listen(config.port, () => {
    logger.info("🚀 Server is running at http://localhost:${config.port}");
  });
}

startServer().catch((error) => {
  logger.error(error, 'Failed to start server');
  process.exit(1);
});