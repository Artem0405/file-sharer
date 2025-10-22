// server/src/core/config.ts
import dotenv from 'dotenv';
import path from 'path';

// 1. Определяем абсолютный путь к корневой папке проекта
const projectRoot = path.resolve(__dirname, '../../../');

// 2. Загружаем переменные из .env файла, который лежит в корне
dotenv.config({ path: path.join(projectRoot, '.env') });

export const config = {
  port: process.env.PORT || 3000,
  database: {
    // 3. Строим абсолютный путь к файлу БД, используя projectRoot
    path: path.join(projectRoot, process.env.DATABASE_PATH || 'server/files.db'),
  },
  uploads: {
    // 4. И к папке загрузок
    dir: path.join(projectRoot, process.env.UPLOADS_DIR || 'server/uploads'),
  },
  files: {
    expirationDays: parseInt(process.env.FILE_EXPIRATION_DAYS || '30', 10),
  },
};