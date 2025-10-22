// server/src/services/files.types.ts

// Тип для данных, которые мы получаем от multer после загрузки файла
export interface UploadedFile {
  originalname: string;
  filename: string; // Это имя файла, сохраненного на диске
  path: string;
  mimetype: string;
  size: number;
}

// Тип для записи, которую мы будем хранить в базе данных
export interface FileDatabaseRecord {
  id: string;
  original_name: string;
  stored_filename: string;
  path: string;
  mimetype: string;
  size: number;
  created_at: string;
  last_downloaded_at?: string | null;
  download_count: number;
}