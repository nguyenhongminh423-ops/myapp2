# myapp2 — My Code Kingdom

Starter fullstack cho người mới bắt đầu: Express API + web tĩnh đơn giản (không cần bundler).

## Chạy dự án

Yêu cầu: Node.js LTS (khuyến nghị cài qua nvm).

1. Cài dependencies
   - `cd myapp2`
   - `npm install`
2. Chạy server
   - `npm start`
3. Mở trình duyệt: `http://localhost:3000`

Scripts hữu ích:
- `npm run dev` — chạy server với chế độ watch (Node 18+).

## Cấu trúc

- `src/server.js` — server Express, route API: `GET/POST/PUT/DELETE /api/todos`, `GET /api/health`.
- `public/` — web UI tĩnh: `index.html`, `app.js`, `styles.css`.

## Học gì từ dự án này

- Cơ bản REST API (status code, body JSON, route CRUD).
- Làm việc với DOM, fetch API, cập nhật UI.
- Tổ chức project tối giản, dễ mở rộng.

## Nâng cấp tiếp theo (gợi ý)

- Lưu dữ liệu với SQLite thay vì mảng trong RAM.
- Thêm validate cao hơn (zod/joi) và xử lý lỗi tập trung.
- Viết test cho hàm xử lý (Vitest/Jest).
- Tách frontend dùng Vite + React sau khi quen cơ bản.
