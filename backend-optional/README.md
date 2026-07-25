# Бекенд — опційний, наразі не використовується

Поточна збірка Kharkiv GO працює **повністю без бекенду** (статичний
фронтенд на GitHub Pages + Telegram Mini App, дані зупинок/маршрутів —
локальний JSON у `frontend/src/data/`).

Цей код лишили про запас на майбутнє, якщо колись зʼявиться потреба у:

- **живих GPS-координатах транспорту** (WebSocket-розсилка вже реалізована
  в `src/services/vehicleWebSocketServer.ts`) — знадобиться, якщо вдасться
  домовитись про доступ до EasyWay API (info@eway.in.ua) або іншого джерела;
- **синхронізації обраного/історії між пристроями** — зараз усе локально
  на пристрої через `localStorage`;
- **повноцінному мультимодальному роутингу з пересадками**.

Якщо вирішите піднімати цей бекенд — знадобиться окремий постійно
працюючий хостинг (Render/Railway/Fly.io тощо), бо GitHub Pages/Actions
для цього не підходять. Інструкція запуску — нижче, вона не змінювалась.

---

## Запуск локально (стара інструкція)

### 1. Інфраструктура (PostgreSQL + Redis)

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend-optional
cp .env.example .env
npm install
psql "$DATABASE_URL" -f migrations/001_init.sql
npm run dev
```

Backend піднімається на `http://localhost:4000`, WebSocket трекінгу — на
`ws://localhost:4000/ws/vehicles`.
