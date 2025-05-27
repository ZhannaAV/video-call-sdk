# Video Call SDK

Проект для реализации видеозвонков с использованием WebRTC и Mediasoup.

Сервер: Node.js + WebSocket, обёрнутый в Docker.

Фронт: Vite + TypeScript + React + Mobx

1. Запуск сервера через Docker


    Переходим в папку сервера: cd src/server
    Сборка Docker-образа: docker build -t video-call-server .
    Запуск контейнера: docker run -p 3000:3000 --name video-call-server video-call-server

После этого сервер будет доступен по адресу ws://localhost:3000

2. Запуск фронтенда


    Установка зависимостей: npm install
    Запуск Vite-сервера: npm run dev

По умолчанию фронт откроется на http://localhost:5173

Как протестировать видеозвонок:

Открыть 2 вкладки и нажать кнопку входа в обеих вкладках.

Видеозвонок установится между вкладками.
