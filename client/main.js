// client/main.js

// --- 1. ПОИСК ЭЛЕМЕНТОВ НА СТРАНИЦЕ ---
// Находим все необходимые для работы элементы DOM и сохраняем их в переменные.
// Это лучшая практика, чем искать их каждый раз заново.
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const fileInputLabel = document.querySelector('.file-input-label'); // Находим кастомный label
const submitButton = document.getElementById('submitButton');

const statusContainer = document.getElementById('statusContainer');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');

const resultContainer = document.getElementById('resultContainer');
const downloadLink = document.getElementById('downloadLink');
const copyButton = document.getElementById('copyButton');

// URL нашего API. Убедись, что он правильный.
const API_URL = 'http://localhost:3000/api/files/upload';


// --- 2. ДОБАВЛЕНИЕ СЛУШАТЕЛЕЙ СОБЫТИЙ ---

// Обрабатываем отправку формы
uploadForm.addEventListener('submit', handleUpload);

// Обновляем текст на кнопке выбора файла, когда файл выбран
fileInput.addEventListener('change', updateFileInputLabel);

// Обрабатываем клик по кнопке "Копировать"
copyButton.addEventListener('click', copyLinkToClipboard);


// --- 3. РЕАЛИЗАЦИЯ ФУНКЦИЙ ---

/**
 * Главная функция-обработчик загрузки файла.
 * @param {Event} e - Событие отправки формы.
 */
async function handleUpload(e) {
  e.preventDefault(); // Предотвращаем стандартную отправку формы

  const file = fileInput.files[0];
  if (!file) {
    showStatus('⚠️ Пожалуйста, выберите файл для загрузки.', 'error');
    return;
  }

  // Блокируем форму на время загрузки
  setFormDisabled(true);
  showResult(false);
  showStatus('🚀 Загрузка началась...', 'info');

  const formData = new FormData();
  formData.append('file', file);

  // Используем XMLHttpRequest для отслеживания прогресса загрузки
  const xhr = new XMLHttpRequest();

  xhr.open('POST', API_URL, true);

  // Слушатель для отслеживания прогресса
  xhr.upload.onprogress = function(event) {
    if (event.lengthComputable) {
      const percentComplete = (event.loaded / event.total) * 100;
      updateProgress(percentComplete);
      statusText.textContent = `Загружено ${Math.round(percentComplete)}%`;
    }
  };

  // Слушатель для обработки успешного завершения запроса
  xhr.onload = function() {
    setFormDisabled(false); // Разблокируем форму
    updateProgress(100);

    if (xhr.status === 201) {
      const response = JSON.parse(xhr.responseText);
      showStatus('✅ Загрузка успешно завершена!', 'success');
      showResult(true, response.downloadLink);
    } else {
      const errorResponse = JSON.parse(xhr.responseText);
      showStatus(`❌ Ошибка: ${errorResponse.error || 'Не удалось загрузить файл.'}`, 'error');
    }
  };

  // Слушатель для обработки ошибок сети
  xhr.onerror = function() {
    setFormDisabled(false);
    showStatus('❌ Произошла ошибка сети. Проверьте подключение.', 'error');
  };

  xhr.send(formData);
}

/**
 * Обновляет текст на кастомной кнопке выбора файла.
 */
function updateFileInputLabel() {
    const fileName = fileInput.files[0]?.name;
    if (fileName) {
        fileInputLabel.textContent = fileName;
    } else {
        fileInputLabel.textContent = 'Выберите файл...';
    }
}

/**
 * Копирует ссылку в буфер обмена.
 */
function copyLinkToClipboard() {
    downloadLink.select();
    document.execCommand('copy');
    copyButton.textContent = 'Скопировано!';
    setTimeout(() => {
        copyButton.textContent = 'Копировать';
    }, 2000);
}

// --- 4. ВСПОМОГАТЕЛЬНЫЕ UI-ФУНКЦИИ ---

/**
 * Блокирует или разблокирует форму.
 * @param {boolean} disabled - Состояние блокировки.
 */
function setFormDisabled(disabled) {
  fileInput.disabled = disabled;
  submitButton.disabled = disabled;
}

/**
 * Обновляет полосу прогресса.
 * @param {number} value - Значение прогресса от 0 до 100.
 */
function updateProgress(value) {
  progressBar.style.width = `${value}%`;
}

/**
 * Показывает или скрывает контейнер с результатом.
 * @param {boolean} visible - Видимость контейнера.
 * @param {string} [link] - Ссылка для скачивания.
 */
function showResult(visible, link = '') {
  if (visible) {
    downloadLink.value = link;
    resultContainer.classList.remove('hidden');
  } else {
    resultContainer.classList.add('hidden');
  }
}

/**
 * Показывает сообщение о статусе.
 * @param {string} message - Текст сообщения.
 * @param {'info'|'success'|'error'} type - Тип сообщения для стилизации (пока не используется, но можно добавить).
 */
function showStatus(message, type) {
  statusText.textContent = message;
  statusContainer.classList.remove('hidden');
}