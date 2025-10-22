// server/src/services/files.service.ts

import crypto from 'crypto';
import { db } from '../core/database';
import { logger } from '../core/logger';
import { UploadedFile, FileDatabaseRecord } from './files.types';

// Объявляем наш сервис как объект с методами.
// Это простой, но эффективный способ организовать логику.
export const FileService = {
  /**
   * Создает запись о файле в базе данных.
   * @param fileData - Информация о загруженном файле от multer.
   * @returns - Полная запись о файле из БД.
   */
  async createFileRecord(fileData: UploadedFile): Promise<FileDatabaseRecord> {
    const fileId = crypto.randomUUID(); // Генерируем безопасный UUID

    const newFileRecord: Omit<FileDatabaseRecord, 'created_at' | 'last_downloaded_at' | 'download_count'> = {
      id: fileId,
      original_name: fileData.originalname,
      stored_filename: fileData.filename,
  path: fileData.path,
      mimetype: fileData.mimetype,
      size: fileData.size,
    };

    try {
      // Knex.insert() возвращает массив с вставленными записями.
      // Мы ожидаем одну, поэтому берем первый элемент.
      const [result] = await db<FileDatabaseRecord>('files')
        .insert(newFileRecord)
        .returning('*'); // 'returning' работает в PostgreSQL, но в SQLite вернет всю запись по умолчанию.

      logger.info({ fileId: result.id }, 'New file record created in DB');
      return result;
    } catch (error) {
      logger.error({ error, fileData }, 'Failed to create file record in DB');
      // Пробрасываем ошибку выше, чтобы контроллер мог ее обработать
      throw new Error('Could not save file metadata.');
    }
  },

  /**
   * Находит файл по его ID и обновляет статистику скачиваний.
   * @param id - UUID файла.
   * @returns - Объект с путем к файлу и его оригинальным именем, или null, если файл не найден.
   */
  async getFileForDownload(id: string): Promise<{ path: string; originalName: string } | null> {
    // 1. Находим файл в БД
    const file = await db<FileDatabaseRecord>('files').where({ id }).first();

    if (!file) {
      logger.warn({ fileId: id }, 'File not found for download');
      return null;
    }

    // 2. Асинхронно обновляем статистику, не блокируя ответ пользователю
    db<FileDatabaseRecord>('files')
      .where({ id })
      .increment('download_count', 1)
      .update({ last_downloaded_at: db.fn.now() })
      .catch(err => logger.error({ err, fileId: id }, 'Failed to update download stats'));

    logger.info({ fileId: id }, 'File found and stats update queued');
    return { path: file.path, originalName: file.original_name };
  },
};