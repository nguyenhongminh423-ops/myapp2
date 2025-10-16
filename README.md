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

## Tính năng mới đã thêm

- Lưu trữ dữ liệu vào file `data/todos.json` (không còn mất khi restart).
- Bộ lọc và tìm kiếm: All / Active / Completed, search theo từ khóa.
- Thống kê nhanh (tổng, đã xong, còn lại) — endpoint `GET /api/stats`.
- Hành động hàng loạt: Toggle All (`POST /api/todos/toggle-all`), Clear Completed (`POST /api/todos/clear-completed`).
- Chỉnh sửa nhanh: double‑click vào nội dung để sửa, Enter lưu, Esc hủy.
- PWA + offline: Service Worker cache UI/API, hàng đợi offline tự đồng bộ khi online.
- Xuất/Nhập JSON: backup và khôi phục danh sách.
- Voice input (Web Speech API): thêm mục bằng giọng nói.
- Nhắc việc + due date: thêm hạn (datetime), thông báo cục bộ khi đến giờ.
- Hiệu ứng celebration 💗 khi hoàn thành, quote ngẫu nhiên truyền cảm hứng.

## Nâng cấp tiếp theo (gợi ý)

- Dùng SQLite thay vì file JSON để hỗ trợ nhiều tiến trình.
- Thêm validate cao hơn (zod/joi) và xử lý lỗi tập trung.
- Viết test cho hàm xử lý (Vitest/Jest).
- Tách frontend dùng Vite + React sau khi quen cơ bản.
