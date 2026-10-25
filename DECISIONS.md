# DECISIONS.md — SpecGate

> **Mục đích:** Ghi lại các quyết định kiến trúc và thiết kế quan trọng trong dự án.  
> Mỗi mục theo mẫu: **Bối cảnh · Quyết định · Lý do**.  
> Quy tắc: Không sửa mục đã chốt; chỉ thêm mục mới để ghi lại sự thay đổi.

---

## Mẫu ghi nhận (Template)

```
### ADR-XXX: [Tiêu đề ngắn gọn]

**Ngày:** YYYY-MM-DD  
**Trạng thái:** [Draft | Accepted | Superseded by ADR-YYY]

**Bối cảnh:**  
Mô tả hoàn cảnh và vấn đề cần quyết định. Điều gì đã thúc đẩy quyết định này?

**Quyết định:**  
Trình bày rõ quyết định đã chọn.

**Lý do:**  
Giải thích tại sao chọn phương án này. Liệt kê các phương án khác đã xem xét và lý do từ chối.

**Hệ quả:**  
Hệ quả tích cực và tiêu cực của quyết định này. Các ràng buộc mới phát sinh.
```

---

## Quyết định đã chốt

---

### ADR-001: Next.js App Router + TypeScript strict

**Ngày:** 2026-10-12  
**Trạng thái:** Accepted

**Bối cảnh:**  
Dự án cần framework cho UI testbed nghiên cứu khoa học. Yêu cầu: SSR/SSG linh hoạt, routing
rõ ràng, TypeScript hạng nhất, và khả năng mở rộng từ S0 đến S15.

**Quyết định:**  
Dùng Next.js (App Router) với TypeScript `strict: true` + `noUncheckedIndexedAccess: true`.

**Lý do:**  
- App Router cho phép co-locate logic và UI theo feature (phù hợp với layout feature-folder).  
- `noUncheckedIndexedAccess` buộc xử lý `undefined` khi truy cập mảng — phù hợp với tính nghiêm ngặt
  của domain (GroundedEvidence phải được kiểm tra trước khi dùng).  
- Next.js API Routes làm mock backend không cần cài server riêng.

**Hệ quả:**  
- Phải dùng `"use client"` explicit cho component có state.  
- Route convention của App Router (`page.tsx`, `layout.tsx`) được tuân thủ nghiêm.

---

### ADR-002: Phân tách Module A (core) khỏi React/Next

**Ngày:** 2026-10-12  
**Trạng thái:** Accepted

**Bối cảnh:**  
Logic hình thức (R1–R6, aggregator, anchor closure, ValueCompare) phải tái sử dụng được
trong môi trường không có DOM (Node.js, Vitest unit test, CLI export).

**Quyết định:**  
`src/core/` bị cấm import `react`, `next`, `features/`, `ui/`, `mock/` bởi ESLint rule
`no-restricted-imports` với pattern matching. Vi phạm gây lỗi lint (không phải warning).

**Lý do:**  
- Tách bạch cho phép unit test `core/` chạy không cần DOM (Vitest environment: `node`).  
- Boundary rõ ràng ngăn coupling ngầm tích lũy theo thời gian ("dependency gravity").  
- ESLint enforcement tốt hơn comment/convention vì được kiểm tra tự động trong `pnpm check`.

**Hệ quả:**  
- Mọi type chia sẻ giữa core và features phải định nghĩa trong `core/` (features import từ core,
  không ngược lại).  
- Component cần gọi core logic phải nhận kết quả qua props hoặc Zustand store.

---

### ADR-003: Bảo vệ trường grading qua grading-proxy.ts

**Ngày:** 2026-10-12  
**Trạng thái:** Accepted

**Bối cảnh:**  
Trường `.grading` trong evidence records là dữ liệu nhạy cảm (held-out split).
Truy cập tự do vào trường này từ bất kỳ file nào là rủi ro data leakage và làm mờ ranh giới
kiểm soát trong audit.

**Quyết định:**  
ESLint rule `no-restricted-syntax` với selector `MemberExpression[property.name='grading']`
cấm tất cả file ngoại trừ `src/guard/grading-proxy.ts` truy cập trực tiếp `.grading`.

**Lý do:**  
- Một điểm vào duy nhất → audit log = một file diff.  
- `no-restricted-syntax` với AST selector là phương pháp ESLint flat config chính xác nhất
  để bắt property access (không phụ thuộc vào tên biến).  
- Tương lai: có thể thêm encryption, RBAC, hoặc audit log tại grading-proxy mà không cần
  thay đổi call sites.

**Hệ quả:**  
- `src/guard/grading-proxy.ts` chứa comment `// eslint-disable-next-line` hợp lệ duy nhất
  cho rule này.  
- Mọi test fixture phải dùng `readGrading()` thay vì truy cập `.grading` trực tiếp.

---

### ADR-004: Cấm UI kit dựng sẵn; chỉ dùng Radix Primitives

**Ngày:** 2026-10-12  
**Trạng thái:** Accepted

**Bối cảnh:**  
UI của dự án có yêu cầu visual đặc thù: dashed border cho UNKNOWN, bo góc phân cấp
(2px/6px/12px), không có "component magic" che khuất accessibility tree.

**Quyết định:**  
Cấm shadcn/ui, Ant Design, Material UI. Cho phép `@radix-ui/*` primitives khi cần
accessibility behavior (dialog, tooltip, dropdown).

**Lý do:**  
- Kiểm soát hoàn toàn visual tokens qua `tokens.css`.  
- Radix cung cấp accessible behavior (focus trap, ARIA) mà không áp đặt visual style.  
- Giảm bundle size và tránh phụ thuộc vào component library upgrade cycles.

**Hệ quả:**  
- Cần tự xây dựng primitives: Chip, DashedCard, QueryTicket, InvariantBar.  
- Mỗi primitive phải có `aria-label`, keyboard navigation, và test a11y trong `pnpm check`.

---

### ADR-005: pnpm làm package manager

**Ngày:** 2026-10-12  
**Trạng thái:** Accepted

**Bối cảnh:**  
Cần package manager phù hợp với workspace monorepo tiềm năng và có performance tốt.

**Quyết định:**  
Dùng pnpm (được pin trong `packageManager` field trong package.json).

**Lý do:**  
- Strict hoisting ngăn phantom dependencies.  
- `pnpm-workspace.yaml` cho phép mở rộng thành monorepo nếu cần tách `core/` thành package.  
- Tốc độ cài đặt nhanh hơn npm/yarn với content-addressable store.

**Hệ quả:**  
- `.npmrc` nên thêm `shamefully-hoist=false` (default pnpm) để giữ strict.  
- CI cần cache `~/.pnpm-store`.

---

---

### ADR-006: Phân định Grounded vs Advisory và Lõi Hình Thức Thuần (Module A)

**Ngày:** 2026-10-12  
**Trạng thái:** Accepted

**Bối cảnh:**  
Bài báo Adjudicated Dual-Oracle Monitoring quy định thẩm quyền phân xử thuộc về nguồn gốc (provenance) của bằng chứng, không thuộc về kỹ thuật sinh. Bằng chứng Advisory (từ LLM, PBT chưa kiểm định) tuyệt đối không được tham gia phân xử.

**Quyết định:**  
- Tách bạch cấu trúc TypeScript: `GroundedEvidence` vs `AdvisoryEvidence` thành discriminated union không thể gán chéo cho nhau.
- Hàm `aggregate()` trong `src/core/aggregator.ts` chỉ nhận tham số `ReadonlyArray<GroundedEvidence>`.
- `src/core/` hoàn toàn là hàm thuần, không import bất kỳ thư viện UI nào (React/Next).

**Lý do:**  
Ngăn chặn hoàn toàn lỗi lọt bằng chứng Advisory vào đường phân xử ngay ở tầng kiểm tra kiểu biên dịch (compile-time type safety).

---

### ADR-007: Vé hỏi Single-Shot Monotonic State Machine (unused -> open -> spent)

**Ngày:** 2026-10-12  
**Trạng thái:** Accepted

**Bối cảnh:**  
Chi phí con người phải được kiểm soát chặt chẽ; mỗi witness chỉ được hỏi người tối đa một lần. Gửi lần 2 là vi phạm giao thức nghiên cứu. Ngoài ra, UNKNOWN_GATE không được hỏi người vì bằng chứng đã đủ (vấn đề nằm ở bản sửa repair).

**Quyết định:**  
- Vòng đời vé hỏi là đơn điệu một chiều: `unused -> open -> spent`.
- `createTicket()` ném lỗi nếu verdict là `UNKNOWN_GATE`.
- API endpoint `POST /api/tickets/[id]/answer` trả mã HTTP 409 Conflict nếu vé đã ở trạng thái `spent`.
- Phím S (Hoãn) giữ vé ở trạng thái `open`, phím C (Không xác định) chuyển vé sang `spent` với cờ `isUncertain: true`.

---

### ADR-008: Khóa cứng tập Held-Out & Lọc bỏ hoàn toàn trường grading

**Ngày:** 2026-10-12  
**Trạng thái:** Accepted

**Bối cảnh:**  
Nguy cơ rò rỉ dữ liệu đánh giá (evaluation data leakage) làm sai lệch kết quả khoa học của các câu hỏi nghiên cứu RQ1–RQ6.

**Quyết định:**  
- `src/guard/heldout.ts`: Cơ chế khóa cứng bằng seed; bất kỳ thao tác nào ghi witness held-out vào tập G hoặc B đều bị chặn và ném lỗi `HeldOutPartitionViolationError`.
- `src/guard/grading-proxy.ts`: Cung cấp hàm `stripGrading()` loại bỏ hoàn toàn thuộc tính `grading` trước khi dữ liệu được gửi ra bất kỳ Route Handler nào.
- ESLint AST rule `MemberExpression[property.name='grading']` cấm truy cập `.grading` ở mọi file khác.

---

### ADR-009: Ngôn ngữ giao diện tập trung tại src/i18n/vi.ts

**Ngày:** 2026-10-12  
**Trạng thái:** Accepted

**Bối cảnh:**  
Văn bản giao diện cần chuẩn hóa tiếng Việt nhất quán, đồng thời bảo toàn nguyên vẹn các thuật ngữ bài báo.

**Quyết định:**  
Tập trung toàn bộ text trong `src/i18n/vi.ts`. Giữ nguyên thuật ngữ: witness, verdict, anchor, repair, Gate, provenance, c-state, ValueCompare, Docket Strip. Không dùng chuỗi cứng trong JSX.

---

### ADR-012: Bỏ mock backend; `/api/*` chỉ proxy sang backend thật

**Ngày:** 2026-10-25  
**Trạng thái:** Accepted (thay thế ý “API Routes làm mock backend” trong ADR-001)

**Bối cảnh:**  
Các Route Handler cũ trả dữ liệu fixture (`src/mock/*`, hằng số RQ trong `src/reporting/results-data.ts`) và UI có run/case ID viết cứng. Kết quả hiển thị trông như số liệu thật dù không phải.

**Quyết định:**  
- Xoá `src/mock/`, các Route Handler nghiệp vụ, `src/core/evaluation-store.ts`, `src/core/evaluation-metrics.ts` và `src/config/dataset.ts`.
- Chỉ giữ `src/app/api/[...path]/route.ts`, chuyển mọi request sang `BACKEND_URL` (`src/lib/server/backend-proxy.ts`). JSON trả về vẫn qua `stripGrading()`.
- Hợp đồng FE ↔ BE nằm ở `api.md` và `src/lib/api/types.ts`.
- Chức năng backend chưa có engine thì trả 501, UI hiện “Chức năng chưa khả dụng” và không bao giờ thay bằng số liệu minh hoạ.
- Run hiện hành lấy từ URL hoặc `GET /api/runs/current` (`RunGate`), không có ID mặc định.

**Hệ quả:**  
- App không chạy độc lập được nữa: cần backend và `BACKEND_URL` (thiếu thì `/api/*` trả 503).
- Test UI giả lập backend ở tầng `fetch` bằng `tests/fixtures/api.ts`. Fixture chỉ nằm trong `tests/`, app không import.

---

## Các quyết định đang chờ xét

- [ ] **ADR-010:** Z3 solver tích hợp: WASM vs. API call cho Gate G5 (quyết định tại S9)
- [ ] **ADR-011:** Export format LaTeX: custom vs. thư viện (quyết định tại S11)

