# SpecGate — UI testbed cho Adjudicated Dual-Oracle Monitoring

Giao diện Next.js (App Router, TypeScript strict, pnpm) để chạy thử luồng phân xử của bài báo **Adjudicated Dual-Oracle Monitoring**.
App không chứa logic của bài báo và không có dữ liệu mẫu: mọi `/api/*` được proxy sang backend `spec_gate_backend` (hợp đồng trong [api.md](api.md)).

---

## Luồng sử dụng (trang Hỏi đáp `/`)

1. **Nhập API key cho 2 LLM**: *LLM sinh đặc tả* và *LLM sinh code* (nhà cung cấp, mô hình, key).
2. **Chọn dataset và tác vụ** cho mô hình. Chưa có dataset thì bấm *Tải dataset (JSONL)*, mỗi dòng là một tác vụ.
3. Bấm **Chạy tác vụ**. Backend sinh đặc tả và sinh code độc lập từ tác vụ, đối chiếu rồi trả kết luận:
   *đặc tả và code khớp nhau*, *lỗi ở đặc tả*, *lỗi ở code* hoặc *chưa đủ căn cứ (UNKNOWN)*.
4. **Chỉ khi kết luận là UNKNOWN** hệ thống mới hỏi lại người dùng, và chỉ hỏi **đúng một lần**.
   Câu trả lời được đối chiếu thêm một vòng; kết luận của vòng này là cuối cùng và ô trả lời biến mất.
5. Bấm **Chạy tác vụ khác** để bắt đầu lại.
6. Mỗi lượt được backend lưu thành một evaluation run: bấm **Xem trong Lịch sử** để mở lại, trang **Thống kê** tổng hợp
   theo phán quyết (biểu đồ tròn và cột), theo đề, theo ngày và theo cặp mô hình.

Ngoài trang Hỏi đáp, sidebar (có nút thu/phóng) còn các trang Dữ liệu (Bằng chứng, Lịch sử, Thống kê), Thực nghiệm (Chạy thực nghiệm, Kết quả RQ, Tiêm lỗi) và Cài đặt.

## Nguyên tắc

- **UI không chứa logic bài báo.** Hỏi hay không, hỏi gì, kết luận ra sao đều do backend quyết định; UI chỉ hiển thị (nhãn, màu, bố cục).
- **API key** nằm trong `sessionStorage` của tab (`LlmConfigProvider`): tải lại trang vẫn còn, đóng tab là mất; gửi kèm từng request `POST /api/run`, không ghi localStorage/IndexedDB.
  Backend nhận key dưới dạng `SecretStr`, không lưu DB, không log. Trang Cài đặt không có ô nhập key.
- **Trường `grading`** của benchmark bị lọc ở proxy (`src/guard/grading-proxy.ts`).
- **Màu** chỉ lấy từ token OKLCH trong `src/styles/tokens.css`; độ tương phản được kiểm bằng `tests/tokens/contrast.test.ts`.

## Cấu trúc mã nguồn

```
src/
  app/                  route mỏng (page.tsx chỉ render Screen), layout gắn <Providers>, proxy /api/[...path]
  features/<tên>/       mỗi tính năng: <Tên>Screen.tsx + components/ + hook riêng
    chat/               trang Hỏi đáp: ChatScreen, DatasetPicker, LlmConfigPanel, ChatReply, ChatComposer,
                        use-chat-run.ts (vòng 1 + lượt hỏi lại duy nhất), llm-config.tsx (key trong bộ nhớ)
    evidence, history, stats, experiments, results, fault-injection, settings, runs
  lib/api/              client (apiRequest, readSse), endpoints (api.*), types (DTO), useApiQuery
  lib/server/           backend-proxy.ts (chuyển /api/* sang BACKEND_URL)
  core/                 kiểu dữ liệu thuần, không React/Next (ESLint chặn import ngược)
  ui/shell|layout|primitives   khung app (Sidebar, Topbar), khối bố cục, Button/Field
  i18n/vi.ts            toàn bộ chuỗi giao diện
  styles/               tokens.css (công thức màu OKLCH), globals.css
tests/                  Vitest + Testing Library; giả lập backend ở tầng fetch (tests/helpers/api-routes.ts)
```

## Khởi chạy

```bash
pnpm install
cp .env.example .env.local   # sửa BACKEND_URL trỏ tới spec_gate_backend
pnpm dev                     # http://localhost:3000
pnpm check                   # tsc --noEmit && eslint . && vitest run
pnpm build && pnpm start     # production
```

Thiếu `BACKEND_URL` thì mọi `/api/*` trả 503 `BACKEND_NOT_CONFIGURED`.

---

## Báo cáo thay đổi (26/10/2026)

### 1. Sửa luồng hỏi đáp

| Trước | Sau |
|---|---|
| Người dùng phải gõ yêu cầu ngay từ đầu | Chọn **dataset + tác vụ** rồi bấm *Chạy tác vụ*, không cần gõ |
| Không có chỗ chọn dataset cho mô hình | Dòng **Dataset / Tác vụ** (`DatasetPicker`), xem trước docstring, tải JSONL khi chưa có dataset |
| Không có lượt hỏi lại | Chỉ khi kết luận **UNKNOWN** mới hỏi người dùng, **đúng một lần**; vòng đối chiếu lại cho kết luận cuối |

Frontend:
- `src/features/chat/ChatScreen.tsx`: màn hình mới theo luồng trên. Ô nhập chỉ xuất hiện khi backend gửi câu hỏi và biến mất sau khi trả lời.
- `src/features/chat/use-chat-run.ts`: hai vòng (`first`, `followup`) và trạng thái `asking`; hook chỉ gom sự kiện SSE, không tự quyết định.
- `src/features/chat/components/DatasetPicker.tsx` (mới), `ChatReply.tsx` (hiển thị theo vòng), `ChatComposer.tsx` (dùng cho câu trả lời).
- `src/lib/api`: thêm `api.datasets.{list, uploadJsonl}`, `api.chat.followup`; kiểu `ChatRequest` (datasetId, taskId), `ChatFollowupRequest`, `verdict.question`.

Backend (`spec_gate_backend`):
- `POST /api/run` nhận `datasetId` + `taskId` (đọc tác vụ từ DB; không có thì 404) thay cho văn bản yêu cầu.
- Kết luận `unknown` kèm `question`; endpoint mới `POST /api/run/followup` đối chiếu lại với câu trả lời và trả kết luận cuối (không kèm câu hỏi).
- Test: `tests/test_judge.py` thêm ca hỏi lại một lần và 404.

Các phần khác (sidebar thu/phóng, ô nhập key 2 LLM, màu, các trang dữ liệu/thực nghiệm) giữ nguyên.

### 2. Dọn file không cần thiết

| Đã xoá | Lý do |
|---|---|
| `playwright.config.ts`, gói `@playwright/test`, script `test:e2e` | Không có test e2e nào |
| `eslint-plugin-jsx-a11y` | `eslint-config-next` đã kèm sẵn (knip báo thừa) |
| `api.pdf` | Bản PDF cũ của `api.md`, đã lỗi thời |
| `scripts/check-no-hex-in-tsx.sh` | Không được gọi ở đâu; màu đã được kiểm bằng test token |
| `AUDIT_REPORT.md`, `DECISIONS.md` | Đã xoá trong working tree; ghi nhận xoá khỏi git |
| Schema/kiểu không còn dùng trong `src/core` (ticket, repair, gate, evidence…), `RunEvent`, helper `ndjson` của test | Phục vụ các màn đã bỏ |
| `.data/`, `tsconfig.tsbuildinfo`, bản build production trong `.next/` (~300 MB) | File sinh ra khi chạy/build, tự tạo lại |

`.gitignore` bị xoá trong working tree đã được **khôi phục**, vì thiếu nó thì `.env.local` (chứa cấu hình) và `node_modules` có thể bị commit nhầm.
`knip` hiện không còn báo file hay dependency thừa.

### 3. Kiểm tra

- `tsc --noEmit`: sạch. `eslint .`: 0 lỗi (1 cảnh báo cũ `sIdx` ở `RQCharts.tsx`).
- `vitest run`: 83/83 test pass. `next build`: thành công.
- Backend `pytest`: 53 pass; 2 test `tests/test_pipeline.py` vẫn fail như trước khi sửa (không liên quan).
- Chạy thật với backend và LLM giả: tải JSONL → chọn tác vụ → kết luận UNKNOWN → hỏi một lần → kết luận cuối *lỗi ở code*; sau khi trả lời không còn ô nhập.
