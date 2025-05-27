# SDK для реализации видеозвонков с использованием WebRTC и Mediasoup

**Сервер:** Node.js + WebSocket, обёрнутый в Docker
**Фронт:** Vite + TypeScript + React + MobX

## 1. Запуск сервера через Docker

Перейти в папку сервера:

```bash
cd src/server
```

Собрать Docker-образ:

```bash
docker build -t video-call-server .
```

Запустить контейнер:

```bash
docker run -p 3000:3000 --name video-call-server video-call-server
```

После этого сервер будет доступен по адресу:

```
ws://localhost:3000
```

## 2. Запуск фронтенда

Установка зависимостей:

```bash
npm install
```

Запуск Vite-сервера:

```bash
npm run dev
```

По умолчанию фронт откроется по адресу:

```
http://localhost:5173
```

## Как протестировать видеозвонок

Открыть две вкладки браузера и нажать кнопку входа в обеих вкладках.
Видеозвонок установится между ними.
