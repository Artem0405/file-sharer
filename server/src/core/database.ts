// server/src/core/database.ts
import knex from 'knex';
import { config } from './config'; // Импортируем нашу конфигурацию
import { logger } from './logger'; // и логгер

// Создаем инстанс Knex
export const db = knex({
  client: 'sqlite3',
  connection: {
    filename: config.database.path, // Путь к файлу БД из конфига
  },
  useNullAsDefault: true,
});

// Функция для первоначальной настройки БД (создания таблицы)
export async function setupDatabase() {
  try {
    const tableExists = await db.schema.hasTable('files');
    if (!tableExists) {
      logger.info('Table "files" does not exist. Creating it...');
      await db.schema.createTable('files', (table) => {
        table.uuid('id').primary(); // Используем UUID для ID
        table.text('original_name').notNullable();
        table.text('stored_filename').notNullable().unique();
        table.text('path').notNullable().unique();
        table.text('mimetype').notNullable();
        table.integer('size').notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('last_downloaded_at');
        table.integer('download_count').defaultTo(0);
      });
      logger.info('Table "files" created successfully.');
    } else {
      logger.info('Table "files" already exists.');
    }
  } catch (error) {
    logger.error(error, 'Failed to setup database.');
    process.exit(1); // Выходим из приложения, если не можем настроить БД
  }
}