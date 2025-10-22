// server/src/index.ts

import express from 'express';
import cors from 'cors';
import { config } from './core/config';
import { logger } from './core/logger';
import { setupDatabase } from './core/database';
import { filesRouter } from './api/files.controller';

// 1. Создаем главный инстанс приложения Express
const app = express();

// 2. Подключаем "Middleware" - функции, которые обрабатывают каждый запрос
//    до того, как он попадет в наши роуты.
app.use(cors()); // Позволяет браузеру делать запросы к нашему API с другого домена
app.use(express.json()); // Автоматически парсит JSON в теле запроса

// --- РОУТЫ ---
// 3. Подключаем наш основной роутер.
//    Это главная точка подключения всей логики API.
//    Все запросы, начинающиеся с "/api/files", будут переданы в filesRouter.
app.use('/api/files', filesRouter);

// --- ЗАПУСК СЕРВЕРА ---
// 4. Создаем асинхронную функцию для запуска, чтобы мы могли дождаться
//    выполнения всех подготовительных шагов (например, настройки БД).
async function startServer() {
  // Сначала убеждаемся, что база данных готова к работе
  await setupDatabase();

  // Затем начинаем слушать входящие HTTP-запросы на порту из конфига
  app.listen(config.port, () => {
    logger.info(`🚀 Server is running at http://localhost:${config.port}`);
  });
}

// 5. Вызываем функцию запуска и ловим любые возможные ошибки на старте.
startServer().catch((error) => {
  logger.error(error, 'Failed to start server');
  process.exit(1); // Если сервер не смог запуститься, завершаем процесс с ошибкой
});