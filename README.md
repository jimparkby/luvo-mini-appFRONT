## Запуск приложения

### Требования

- Node.js (рекомендуется последняя LTS версия)
- npm

### Локальная разработка

1. **Установите зависимости:**

   npm install 2. **Создайте файл `.env` в корне проекта** и заполните переменные окружения:

   VITE_API_URL=your_backend_url_here
   VITE_FAKE_INIT_DATA=your_fake_telegram_init_data_here

   > **Важно:**
   >
   > - `VITE_API_URL` — URL вашего бэкенда
   > - `VITE_FAKE_INIT_DATA` — фейковые данные из Telegram для локальной разработки (используются вместо реальных данных Telegram WebApp)

2. **Запустите приложение:**sh
   npm run dev
   ### Сборка для продакшена

npm run build
Собранные файлы будут находиться в папке `dist`.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Расширение конфигурации ESLint

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
