// server/src/index.ts

import express from 'express';
import cors from 'cors';
import { config } from './core/config';
import { logger } from './core/logger';
import { setupDatabase } from './core/database';

// Создаем главный "дирижер" нашего приложения - инстанс Express
const app = express();

// --- Настройка Middleware ---
// Middleware - это функции, которые обрабатывают запрос перед тем,
// как он дойдет до наших роутов.

// Включаем CORS для всех запросов. Это позволит нашему фронтенду
// (который будет на другом "origin" при разработке) общаться с сервером.
app.use(cors());

// Включаем встроенный парсер JSON. Он будет автоматически превращать
// JSON-тело запроса в JavaScript-объект.
app.use(express.json());

// --- Роуты ---
// Пока добавим один тестовый роут, чтобы проверить, что сервер работает.
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'File Sharer API is running!' });
});

// --- Запуск сервера ---
// Оборачиваем запуск в асинхронную функцию, чтобы дождаться
// инициализации всех сервисов (например, БД).
async function startServer() {
  // 1. Настраиваем базу данных (создаем таблицу, если ее нет)
  await setupDatabase();

  // 2. Начинаем слушать порт, указанный в конфигурации
  app.listen(config.port, () => {
    logger.info(`🚀 Server is running at http://localhost:${config.port}`);
  });
}

// Вызываем нашу функцию для запуска сервера.
startServer().catch((error) => {
  logger.error(error, 'Failed to start server');
  process.exit(1); // Выходим с ошибкой, если запуск не удался
});