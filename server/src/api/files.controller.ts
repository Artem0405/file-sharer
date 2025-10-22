// server/src/api/files.controller.ts

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../core/config';
import { logger } from '../core/logger';
import { FileService } from '../services/files.service';

// --- Настройка Multer для обработки загрузки файлов ---

// Проверяем, существует ли директория для загрузок, и создаем ее, если нет.
const uploadDir = config.uploads.dir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настраиваем хранилище. Мы будем сохранять файлы на диск.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Папка, куда сохранять файлы
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла, чтобы избежать конфликтов.
    // Пример: 'file-1679347200000-abcdef.png'
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Создаем инстанс multer с нашими настройками.
const upload = multer({
  storage: storage,
  // Добавляем фильтр для безопасности (как в ревью)
  limits: {
    fileSize: 10 * 1024 * 1024, // Лимит 10MB
  },
  fileFilter: (req, file, cb) => {
    // Пример простого фильтра по MIME-типу (можно расширить)
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/zip'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      logger.warn({ mimetype: file.mimetype }, 'Rejected file upload due to invalid type');
      cb(new Error('Invalid file type.'));
    }
  }
});

// --- Создание роутера ---
const router = Router();

// --- Определение роутов ---

// POST /api/files/upload - Роут для загрузки файла
router.post('/upload', upload.single('file'), async (req, res) => {
  // 'file' - это имя поля в multipart/form-data

  // 1. Проверяем, был ли файл загружен multer'ом
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or file type is invalid.' });
  }

  try {
    // 2. Вызываем наш сервис для создания записи в БД
    const fileRecord = await FileService.createFileRecord(req.file);

    // 3. Формируем ссылку для скачивания
    const downloadLink = `http://localhost:${config.port}/api/files/download/${fileRecord.id}`;

    // 4. Отправляем успешный ответ
    return res.status(201).json({ downloadLink });

  } catch (error) {
    logger.error(error, 'Error processing file upload');
    // TODO: Удалить загруженный файл с диска, если запись в БД не удалась.
    return res.status(500).json({ error: 'Failed to process file upload.' });
  }
});

// GET /api/files/download/:id - Роут для скачивания файла
router.get('/download/:id', async (req, res) => {
  try {
    const fileId = req.params.id;

    // 1. Вызываем сервис для получения информации о файле
    const fileData = await FileService.getFileForDownload(fileId);

    // 2. Проверяем, найден ли файл
    if (!fileData) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // 3. Отправляем файл пользователю
    // res.download() - удобный метод Express для отправки файлов
    res.download(fileData.path, fileData.originalName, (err) => {
      if (err) {
        logger.error({ err, fileId }, 'Error sending file to user');
      }
    });
  } catch (error) {
    logger.error(error, 'Error processing file download');
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export { router as filesRouter };