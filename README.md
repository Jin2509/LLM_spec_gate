# Adjudicated Dual-Oracle Monitoring v1.4 Testbed

UI testbed Next.js App Router (TypeScript strict, pnpm) phục vụ nghiên cứu và thẩm định cho bài báo khoa học **"Adjudicated Dual-Oracle Monitoring v1.4"**.

---

## 🔬 Tính năng Cốt lõi & Kiến trúc

1. **Lõi Hình thức Thuần (`src/core/`)**:
   - Zero framework/React dependencies.
   - Các thuật toán chính quy: `equivalence.ts`, `serialize.ts`, `aggregator.ts`, `gate.ts`, `ticket.ts`, `repair.ts`, `revocation.ts`, `experiment.ts`.
   - Ranh giới kiến trúc được kiểm soát nghiêm ngặt qua ESLint rule `no-restricted-imports`.

2. **Bàn Phân xử (Case Workbench & Docket Strip)**:
   - Dải hồ sơ 2 pha (Pha 1 Đồng bộ $\to$ Pha 2 Sửa & Kiểm).
   - Kiểm soát tương tranh tất định bằng `evalId`.
   - Danh sách lời gọi hàm ảo hóa cuộn mượt mà >5.000 dòng log.
   - Thẻ hỏi người đơn xung (Single-shot) với tem đóng dấu "ĐÃ SỬ DỤNG".

3. **Không gian Sửa đổi (Repair & Gate) & Thu hồi Bản vá**:
   - Xếp hạng tất định ứng viên $C \lor (g \land D)$.
   - Pipeline G1–G5 fail-fast; hỗ trợ 3 chính sách (Strict / Standard / Shadow).
   - Kho bằng chứng hình thức (Evidence Store) bất biến, kiểm tra $G \cap B = \emptyset$.
   - Mô phỏng thu hồi bản vá qua cơ chế tiêm vết xấu vào $B$.

4. **Thực nghiệm & Phân tích Kết quả (RQ1–RQ6)**:
   - Bộ điều phối thực nghiệm với tính tất định tuyệt đối: Cùng seed sinh ra Manifest giống hệt nhau.
   - Thống kê Bootstrap CI 95% có seed, kiểm soát ngưỡng $n \ge 30$.
   - Toàn bộ điểm dữ liệu biểu đồ liên kết trực tiếp về witness và Docket Strip.
   - Xuất dữ liệu: LaTeX tabular, CSV, JSON, Manifest.

---

## 🚀 Khởi chạy Dự án

### 1. Cài đặt Dependencies
```bash
pnpm install
```

### 2. Kiểm tra Toàn diện (Typecheck + Lint + Tests)
```bash
pnpm check
```
> Tương đương với: `tsc --noEmit && eslint . && vitest run`.

### 3. Kiểm tra Token Màu sắc (Không dùng mã hex trong `.tsx`)
```bash
bash scripts/check-no-hex-in-tsx.sh
```

### 4. Chạy Môi trường Phát triển (Dev Server)
```bash
pnpm dev
```
Truy cập [http://localhost:3000](http://localhost:3000).

### 5. Build Production
```bash
pnpm build
pnpm start
```

### 6. Nối với backend thật (spec_gate_backend)

Mọi request tới `/api/backend/*` được proxy (rewrite trong `next.config.ts`) sang [spec_gate_backend](https://github.com/WhoKeng/spec_gate_backend), mặc định `http://localhost:8000`; đổi bằng biến môi trường `BACKEND_URL` (ví dụ trong `.env.local`). Các route `/api/*` khác vẫn là mock trong repo này.

1. Chạy backend theo README của nó (có chế độ fixtures, không tốn API).
2. `pnpm dev`, mở [http://localhost:3000/pipeline](http://localhost:3000/pipeline) (mục "Pipeline thật" ở sidebar).
3. Bấm "Chạy pipeline": backend chạy `setup → admit → run` của ADOM, trang theo dõi sự kiện qua SSE.

Code: `src/features/backend/` (type, reducer sự kiện, hook gọi backend), trang `src/app/pipeline/page.tsx`.

---

## 🛡️ Nguyên tắc An toàn Dữ liệu Khoa học

- **Cách ly trường `grading`**: Toàn bộ trường `grading` của bộ benchmark bị lọc bỏ tại `src/guard/grading-proxy.ts`, cấm đọc trực tiếp tại các tầng khác.
- **Tập Held-out Bất biến**: Sau khi chia tập tất định bằng seed, tập held-out được khóa vĩnh viễn (`src/guard/heldout.ts`).
- **Bảo mật API Keys**: API Keys chỉ được cấu hình phía server (`.env.local`). Hệ thống cấm lưu trữ API Key ở phía client.
