# API Contract — SpecGate

Tài liệu hợp đồng giữa front-end và back-end. Mọi component phía client đều gọi API qua `src/lib/api` (`api.*`); không component nào gọi `fetch` trực tiếp. Kiểu dữ liệu (DTO) nằm ở `src/lib/api/types.ts`. Khi backend đổi hợp đồng, sửa file đó trước, rồi tới tài liệu này.

## Kiến trúc

```
Trình duyệt ──fetch /api/*──▶ Next.js  src/app/api/[...path]/route.ts  ──▶  ${BACKEND_URL}/api/*
              (src/lib/api)      (proxy thuần: không dữ liệu, không logic)     (backend thật)
```

- App Next.js **không còn mock data hay Route Handler nghiệp vụ**. Chỉ còn một route catch-all (`src/lib/server/backend-proxy.ts`) chuyển nguyên method, path, query, header và body sang backend.
- Cấu hình: biến môi trường máy chủ `BACKEND_URL` (xem `.env.example`). Thiếu biến này thì mọi `/api/*` trả **503** `BACKEND_NOT_CONFIGURED`. Backend không kết nối được thì trả **502** `BACKEND_UNREACHABLE`.
- Response JSON vẫn đi qua `stripGrading()` ở proxy như lớp bảo vệ thứ hai. Backend vẫn **phải** tự loại `grading`.
- Stream (SSE, NDJSON) và file tải về (`Content-Disposition: attachment`) được truyền thẳng, không buffer.
- Toàn bộ endpoint dưới đây do **backend** cài đặt. Path của backend trùng path trong tài liệu (gồm cả tiền tố `/api`).

## Quy ước chung

| Mục | Quy ước |
|---|---|
| Base path | `/api` |
| Định dạng | JSON (`Content-Type: application/json`), trừ các ngoại lệ ghi rõ: SSE, CSV |
| Lỗi | Status ≠ 2xx với body `{ "error": string, "code"?: string }`. `error` là thông điệp tiếng Việt hiển thị thẳng cho người dùng. `ApiError` ở client đọc `error` và `code` |
| **Chưa có engine** | Chức năng cần LLM / Z3 / pipeline mà backend chưa có thì trả **501** `{ "error": "<lý do>", "code": "ENGINE_NOT_CONFIGURED" }`. UI hiển thị “🚧 Chức năng chưa khả dụng” (`data-testid="feature-unavailable"`) và **không bao giờ** thay bằng số liệu minh hoạ |
| Không có dữ liệu | Trả rỗng hợp lệ (`[]`, `total: 0`) chứ không trả dữ liệu mẫu. 404 chỉ dùng khi tài nguyên được hỏi đích danh không tồn tại |
| `grading` | **Bắt buộc** loại trường `grading` khỏi mọi response |
| API keys | Chỉ `POST /api/run` và `POST /api/run/followup` nhận key (của 2 LLM do người dùng nhập ở trang Hỏi đáp) trong body; backend dùng trong request rồi bỏ, không lưu DB, không log, không trả lại. Mọi endpoint khác không nhận/trả key; lượt chạy thực nghiệm dùng key ở môi trường backend |
| Huỷ request | Client gửi `AbortSignal`; proxy chuyển tín hiệu huỷ sang backend |

Các endpoint có thể trả **501** khi chưa có engine: 4.4 (stream phân xử), 4.5 (ứng viên sửa), 6.1–6.2 (admission), 7.1 (evidence), 8.2 (tiêm vết xấu), 9.1 (kết quả RQ), 10.2–10.4 (experiments), 11.2 (fault-injection).

## Tổng quan endpoint

Giao diện chỉ còn một trang hỏi đáp (`/`) thay cho các màn vòng đời tách rời (Thiết lập, Kiểm nạp, Phân xử, Hỏi người, Sửa đặc tả, Duy trì). Các endpoint của những màn đó vẫn nằm trong hợp đồng backend nhưng UI không gọi nữa.

| # | Method | Path | Front-end dùng ở |
|---|---|---|---|
| 0 | POST | `/api/run`, `/api/run/followup` (SSE) | `ChatScreen` → `useChatRun` (trang Hỏi đáp) |
| 1 | GET | `/api/datasets` | `DatasetPicker` (trang Hỏi đáp) |
| 2 | POST | `/api/datasets` | `DatasetPicker` (tải JSONL) |
| 3 | GET | `/api/datasets/{datasetId}/tasks` | — *(UI không còn gọi; backend vẫn giữ)* |
| 4 | GET | `/api/runs` | `HistoryScreen` |
| 5 | POST | `/api/runs` | — *(UI không còn gọi; backend vẫn giữ)* |
| 6 | DELETE | `/api/runs` | `HistoryScreen` |
| 7 | GET | `/api/runs/current` | `RunGate` (route không có `[runId]`) |
| 8 | GET | `/api/runs/{runId}` | `RunDetailScreen` |
| 9 | GET | `/api/runs/{runId}/summary` | `Topbar` |
| 10 | PATCH | `/api/runs/{runId}` | — *(UI không còn gọi; backend vẫn giữ)* |
| 11 | PATCH | `/api/runs/{runId}/review` | `RunDetailScreen` → `ReviewForm` |
| 12 | POST | `/api/runs/{runId}/followup` | — *(UI không còn gọi; backend vẫn giữ)* |
| 13 | GET | `/api/runs/export?format=` | `HistoryActions` (link tải) |
| 14 | GET | `/api/logs/stream?runId=` (SSE) | — *(UI không còn gọi; backend vẫn giữ)* |
| 15 | GET | `/api/stats` | `StatsScreen` |
| 16 | GET | `/api/runs/{runId}/manifest` | — *(UI không còn gọi; backend vẫn giữ)* |
| 17 | POST | `/api/runs/{runId}/lock-heldout` | — *(UI không còn gọi; backend vẫn giữ)* |
| 18 | GET | `/api/runs/{runId}/events` (SSE) | — *(UI không còn gọi; backend vẫn giữ)* |
| 19 | GET | `/api/cases?runId=&hasTicket=` | — *(UI không còn gọi; backend vẫn giữ)* |
| 20 | GET | `/api/cases/{caseId}` | — *(UI không còn gọi; backend vẫn giữ)* |
| 21 | GET | `/api/runs/{runId}/cases/{caseId}/repair-candidates` | — *(UI không còn gọi; backend vẫn giữ)* |
| 22 | POST | `/api/cases/{caseId}/repair/deploy` | — *(UI không còn gọi; backend vẫn giữ)* |
| 23 | POST | `/api/runs/{runId}/cases/{caseId}/stream` (NDJSON) | — *(UI không còn gọi; backend vẫn giữ)* |
| 24 | POST | `/api/tickets/{ticketId}/answer` | — *(UI không còn gọi; backend vẫn giữ)* |
| 25 | POST | `/api/tickets/{ticketId}/defer` | — *(UI không còn gọi; backend vẫn giữ)* |
| 26 | GET | `/api/runs/{runId}/annotation-queue` | — *(UI không còn gọi; backend vẫn giữ)* |
| 27 | GET | `/api/runs/{runId}/admission` | — *(UI không còn gọi; backend vẫn giữ)* |
| 28 | POST | `/api/runs/{runId}/admission` | — *(UI không còn gọi; backend vẫn giữ)* |
| 29 | POST | `/api/runs/{runId}/admission/review` | — *(UI không còn gọi; backend vẫn giữ)* |
| 30 | GET | `/api/runs/{runId}/evidence` | `EvidenceScreen` |
| 31 | GET | `/api/runs/{runId}/revocation` | — *(UI không còn gọi; backend vẫn giữ)* |
| 32 | POST | `/api/runs/{runId}/revocation` | — *(UI không còn gọi; backend vẫn giữ)* |
| 33 | GET | `/api/runs/{runId}/results/{rq}` | `ResultsScreen` → `RQChart`, `ChartContainer` |
| 34 | GET | `/api/experiments/options` | `ExperimentsScreen` → `ExperimentConfigForm` |
| 35 | POST | `/api/experiments/plan` | `ExperimentsScreen` → `CostEstimatePanel` |
| 36 | POST | `/api/experiments` | `useBatchRun` |
| 37 | GET | `/api/experiments/{experimentId}` | `useBatchRun` (poll 500 ms) |
| 38 | GET | `/api/fault-injection` | `FaultInjectionScreen` |
| 39 | POST | `/api/fault-injection` | `FaultInjectionScreen` |
| 40 | GET | `/api/settings` | `SettingsScreen` |
| 41 | PUT | `/api/settings` | `SettingsScreen` |

---

## 0. Hỏi đáp — `POST /api/run`, `POST /api/run/followup` (SSE)

Luồng của trang Hỏi đáp (`/`):

1. Người dùng chọn **dataset + tác vụ** (1.1, upload bằng 1.2) và nhập key của 2 LLM. Không phải gõ gì.
2. `POST /api/run`: backend đọc tác vụ, sinh đặc tả bằng LLM đặc tả, sinh code bằng LLM code (độc lập), đối chiếu rồi trả kết luận. Mỗi lượt được lưu thành một **evaluation run** (mục 2), nên hiện trong Lịch sử và Thống kê; key không bao giờ được lưu.
3. Chỉ khi kết luận là `unknown`, backend kèm `question`. UI hiện câu hỏi và mở ô trả lời **đúng một lần**.
4. `POST /api/run/followup`: đối chiếu lại với câu trả lời; kết luận trả về là **cuối cùng** (không bao giờ kèm `question`).

`POST /api/run`:

```json
{
  "datasetId": "ds_…", "taskId": "t_median",
  "llmSpec": { "provider": "openai" | "anthropic", "model": "gpt-4o-mini", "apiKey": "sk-…" },
  "llmCode": { "provider": "openai" | "anthropic", "model": "claude-sonnet-5-5", "apiKey": "sk-ant-…" }
}
```

`POST /api/run/followup`:

```json
{ "runId": "eval_…", "datasetId": "ds_…", "taskId": "t_median", "llmSpec": { … }, "spec": "<đặc tả vòng 1>", "code": "<code vòng 1>", "answer": "<câu trả lời>" }
```

`runId` là id nhận ở event `run` của vòng đầu; lượt hỏi lại được ghi tiếp vào run đó (`followup_used = true`).

- Body sai → **400** `VALIDATION_ERROR` (không chứa key). Dataset/tác vụ/run không tồn tại → **404** `NOT_FOUND`. Run đã dùng lượt hỏi lại → **409**.
- Backend chưa có engine Hỏi đáp → **501** `ENGINE_NOT_CONFIGURED` (trả trước khi tạo run, không ghi DB).
- Response `text/event-stream`, theo thứ tự:

| event | data |
|---|---|
| `run` | `{ runId: string }` — luôn là sự kiện đầu tiên: id của evaluation run |
| `step` | `{ step: "spec" \| "code" \| "check", status: "running" }` (vòng hỏi lại chỉ có `check`) |
| `step` | `{ step, status: "done", output: string, durationMs: number }` |
| `verdict` | `{ verdict: "consistent" \| "spec_fault" \| "code_fault" \| "unknown", reason: string, question?: string }` — sự kiện cuối |
| `error` | `{ message: string, step? }` — sự kiện cuối khi lỗi; không bao giờ chứa key |

- Hỏi hay không, hỏi gì và kết luận ra sao do backend quyết định (`app/judge.py`, pipeline tạm chờ logic bài báo). UI chỉ hiển thị.
- Ghi vào evaluation run: `spec`/`code` = `{ agent, model, version: provider, status, output, latencyMs }`; mỗi `verdict` append vào `verdicts[]` theo ánh xạ `consistent→ACC`, `spec_fault→SPEC_FAULT`, `code_fault→CODE_FAULT`, `unknown→UNKNOWN` và thêm một turn `system`; câu trả lời lượt hỏi lại là một turn `user`. `status`: `answered` khi đang chờ trả lời, `final` khi xong, `error` khi lỗi.
- Key: UI giữ trong `sessionStorage` của tab (`LlmConfigProvider` ở root layout): tải lại trang vẫn còn, đóng tab là mất; không ghi localStorage/IndexedDB. Nút “Xoá key” xoá ngay.

## 1. Datasets & Tasks

### 1.1 `GET /api/datasets`
Danh sách dataset, mỗi dataset kèm toàn bộ task. Dùng cho dòng chọn dataset + tác vụ ở trang Hỏi đáp (`DatasetPicker`).

**200** `DatasetListResponse`
```ts
{ datasets: Array<{ id: string; name: string; version: string; taskCount: number; tasks: AcademicTask[] }> }
```

### 1.2 `POST /api/datasets` — upload JSONL
- Body: text thô, mỗi dòng một `AcademicTask` (`Content-Type: application/x-ndjson`).
- Validate bằng `AcademicTaskSchema` (`src/core/schema.ts`).
- **201** `{ success: true, message, taskCount, tasks }`
- **400** body rỗng
- **422** `{ success: false, totalLines, validCount, errorCount, errors: [{ line, field?, message }] }`

### 1.3 `GET /api/datasets/{datasetId}/tasks`
**200** `DatasetTasksResponse` → `{ datasetId, taskCount, tasks: AcademicTask[] }` · **404** dataset không tồn tại.

`AcademicTask`:
```ts
{ id: string; name: string; intentDocstring: string;
  outputType: "int" | "str" | "list" | "float" | "bool" | "other";
  isUniqueOutput: boolean; assignedBy: string; anchorOrigin: "gốc" | "dẫn xuất";
  epsilon?: number; hasA2: boolean; hasA3: boolean;
  anchorLevel: "A0" | "A1" | "A2" | "A3"; isBSynthSupported: boolean }
```

---

## 2. Evaluation runs (Kiểm thử · Lịch sử · Thống kê)

Backend lưu bền vững (DB). App không còn lưu run cục bộ.

`Run` (`src/core/evaluation-types.ts`):
```ts
{ run_id: string; created_at: ISO; updated_at: ISO;
  dataset: { id: string; version: string }; problem_id: string; problem: string;
  spec?: AgentOutput; code?: AgentOutput; turns: Turn[]; verdicts: EvalVerdict[];
  confidence?: number; latency: Record<string, number>; gold_label?: EvalVerdict;
  logs?: RunLog[]; status: "queued" | "spec_running" | "code_running" | "judging" | "answered" | "followup" | "final" | "error";
  review?: { agree: boolean; note: string; at: ISO } }
```

### 2.1 `GET /api/runs`
Query (đều tuỳ chọn): `page` (mặc định 1), `pageSize` (1–100, mặc định 25), `verdict` (khớp chuỗi con, không phân biệt hoa thường, so với verdict cuối), `problem` (khớp `problem_id + problem`), `dataset`, `from`, `to` (ISO date, so với `created_at`).

**200** `RunListResponse` → `{ total, page, pageSize, runs: Run[] }`, sắp `created_at` giảm dần.

### 2.2 `POST /api/runs`
Endpoint này có **hai chế độ** (backend nên tách thành hai endpoint riêng):

a) Evaluation run (`ChatTestbed` dùng):
```json
{ "mode": "evaluation", "datasetId": "<id từ /api/datasets>", "datasetVersion": "<version từ /api/datasets>", "problemId": "<taskId của case>", "problem": "<nội dung người dùng nhập>" }
```
→ **201** `{ run: Run }` (status `queued`, có sẵn 1 turn `user`).

b) Khởi tạo run thực nghiệm có chia held-out: `{ datasetId?, seed?, heldOutRatio? }` → **201** `RunManifest` · **400** nếu `heldOutRatio ∉ (0,1)`.

### 2.3 `DELETE /api/runs`
Body `{ "confirmation": "XOA LICH SU" }` → **200** `{ deleted: true }` · **400** sai cụm xác nhận.

### 2.4 `GET /api/runs/current` — run đang hoạt động
Dùng cho các trang không có `[runId]` trên URL (`/`, `/lab`, `/library`, `/admission`, `/annotate`, `/evidence`, `/revocation`, `/results`, `/workbench`, `/repair-gate`). Front-end không còn run ID mặc định viết cứng.
**200** `{ runId: string }` · **404** `{ error }` khi chưa có run nào (UI hiện lỗi kèm “Thử lại”).
Đường dẫn tĩnh `current` phải được backend khớp **trước** route `/api/runs/{runId}`.

### 2.5 `GET /api/runs/{runId}`
**200** `{ run: Run }` · **404**.

### 2.6 `GET /api/runs/{runId}/summary` — bối cảnh cho Topbar
**200** `RunSummary`:
```ts
{ runId: string; datasetName: string; anchorLevel: "A0" | "A1" | "A2" | "A3"; monitorVersion: string;
  isHeldOutLocked: boolean; isDisjointGB: boolean;            // bất biến G ∩ B = ∅ tính trên kho bằng chứng thật
  ticketsSpent: number; ticketsTotal: number; rejectedWritesCount: number }
```
Lỗi hoặc 404 thì Topbar chỉ hiện mã run, không hiện số liệu.

### 2.7 `PATCH /api/runs/{runId}`
Ghi kết quả phân xử vào run. Mọi trường đều tuỳ chọn:
```ts
{ patch?: Partial<{ status; confidence; gold_label }>;
  turn?: { role: "user" | "system"; content: string; verdict?: EvalVerdict; confidence?: number; latencyMs?: number }; // server tự sinh id, at
  verdict?: EvalVerdict;                 // append vào verdicts[]
  latency?: Record<string, number>;      // merge vào latency
  log?: string; level?: "info" | "warn" | "error" }  // append vào logs[]
```
→ **200** `{ run: Run }` · **404**.

> ⚠️ Backend **phải whitelist** các trường trong `patch` (chỉ `status`, `confidence`, `gold_label`).

### 2.8 `PATCH /api/runs/{runId}/review`
Body `{ agree: boolean, note: string }` → **200** `{ run }` · **400** sai kiểu · **404**.

### 2.9 `POST /api/runs/{runId}/followup`
Lượt bổ sung **duy nhất** khi verdict UNKNOWN. Body `{ content: string }` (không rỗng).
**200** `{ run }` (status `followup`) · **400** rỗng · **404** · **409** đã dùng lượt bổ sung.

### 2.10 `GET /api/runs/export?format=csv|json|stats`
Tải file (`Content-Disposition: attachment`). Mặc định `json`. CSV gồm các cột: `run_id, created_at, dataset, problem_id, problem, verdict, confidence, status, gold_label, review_agree, review_note`.

### 2.11 `GET /api/logs/stream?runId=` — SSE
Mỗi message: `data: RunLog\n\n` với `RunLog = { id, at, level, message }`. Server đóng stream khi run ở trạng thái `final` hoặc `error`. **400** thiếu `runId`.

### 2.12 `GET /api/stats`
Query: `dataset`, `verdict`, `from`, `to`.
**200** `StatsResponse` → `{ metrics: Metrics, runs: Run[] }`
```ts
Metrics = { totalRuns; byVerdict: Record<string, number>; accuracy?; averageConfidence?;
            latency: { mean?; p50?; p95? }; followupsUsed; unknownResolvedRate? }
```
Các biểu đồ còn lại (theo đề, theo ngày, ma trận nhầm lẫn, histogram confidence, so sánh cặp model) tính ở client từ `runs` (`src/features/stats/derive.ts`). Thẻ “So sánh phiên bản agent/model” đọc `run.spec.model/version` và `run.code.model/version`, nên backend cần ghi các trường này vào `Run`. Nếu số run lớn, backend nên trả sẵn các tổng hợp để khỏi gửi toàn bộ `runs`.

---

## 3. Held-out partition

### 3.1 `GET /api/runs/{runId}/manifest`
**200** `RunManifest` · **404**.
```ts
RunManifest = { id; datasetId; seed; heldOutRatio; totalTasks; runTaskIds: string[]; heldOutTaskIds: string[];
                isHeldOutLocked: boolean; activeMonitorVersion: string; createdAt: ISO }
```
`LibraryScreen` dùng manifest để biết dataset của run (`datasetId` → tải task), giá trị khởi tạo của ô seed/tỷ lệ (`seed`, `heldOutRatio`) và trạng thái khoá (`isHeldOutLocked`).

### 3.2 `POST /api/runs/{runId}/lock-heldout`
Body: `{ seed?: string, heldOutRatio?: number }` — seed và tỷ lệ người dùng chọn trên UI.
Nếu run chưa phân chia, backend dùng hai giá trị này để chia tất định rồi khoá. Sau khi khoá thì không được ghi đè nữa.
**200** `{ success: true, message, manifest: RunManifest }` · **400** `{ error }` (đã khoá, run không tồn tại…).

### 3.3 `GET /api/runs/{runId}/events` — SSE có thể nối lại
- Mỗi event: `id: <seq>\nevent: <type>\ndata: <json>\n\n`, `seq` tăng dần từ 1.
- Nối lại bằng header `Last-Event-ID` hoặc query `?lastEventId=`: chỉ phát các event có `seq > lastEventId`, không mất, không trùng.
- `type ∈ run_created | admission_step | admission_completed | verdict | heldout_locked | repair_deployed | patch_revoked`.
- **404** run không tồn tại.

---

## 4. Cases, Repair & luồng phân xử

`CaseDossier` (`src/core/types.ts`): `{ id, taskId, witness, codeOutput, specP0, monitorRejectionClause?, isFlaky?, groundedEvidence[], advisoryEvidence[], adjudication: { verdict, matchedRule, explanation, ... }, ticket?: HumanQueryTicket, repairCandidate?, gateResult?, currentMonitorVersion }`.

### 4.1 `GET /api/cases`
Query: `runId` (front-end luôn gửi) để lọc case theo run; `hasTicket=true` để chỉ lấy case có vé hỏi người.
**200** `CaseListResponse` → `{ cases: CaseDossier[] }` (rỗng nếu run chưa có case).
Dùng cho danh sách case trong `ChatTestbed` (case đầu tiên là mặc định, xoay vòng khi bấm “Phiên mới”) và ô chọn case trong `RepairGateScreen`. Nên phân trang khi số case lớn.

### 4.2 `GET /api/cases/{caseId}`
**200** `CaseDossier` · **404**.

### 4.5 `GET /api/runs/{runId}/cases/{caseId}/repair-candidates`
Ứng viên sửa đặc tả `C ∨ (g ∧ D)` cho một case, **mỗi ứng viên đã được backend chạy Gate và xếp hạng tất định** (trường `rank`, 1 là ưu tiên nhất). Front-end **không chứa logic của bài báo**: chỉ hiển thị theo `rank`, hiển thị `gateResult`/`passMode` như backend trả về và khoá nút triển khai khi `gateResult.passed = false`; không tự xếp hạng, không tự kiểm Gate, không tự áp chính sách.

**200** `RepairCandidatesResponse`:
```ts
{ caseId: string;
  candidates: Array<{
    id: string; family: "case_exception" | "point_patch" | "broaden_bounds" | "replace_predicate";
    guard: string; replacement: string; targetExpectedOutput: unknown; rank: number; diffPreview: string;
    complexity: number; breadth: number;
    passMode?: "PASS_PROOF" | "PASS_SAMPLED" | "PASS_NO_A2"; isProofVerified?: boolean; hasA2Anchor?: boolean;
    gateResult: GateResult;          // { passed, checks: { g1_accept_grounded, g2_reject_b, g3_locality, g4_preserve_g_a2, g5_in_repair_space_and_bsynth }, guaranteeNature, message }
    isBEmptyInGuard: boolean }> }    // B ∪ B_synth rỗng trong vùng guard g → UI cảnh báo vacuous patch
```
`candidates: []` thì UI báo “Backend chưa sinh ứng viên”. **404** case không tồn tại · **501** chưa có engine sinh/đánh giá ứng viên.

### 4.3 `POST /api/cases/{caseId}/repair/deploy`
Body `DeployRepairRequest`:
```ts
{ repairCandidate?: RepairCandidate;   // bỏ trống thì dùng candidate có sẵn trong dossier
  policy: "strict" | "standard" | "shadow";
  isProofVerified?: boolean; hasA2Anchor?: boolean }
```
**200** `DeployRepairResponse`:
```ts
{ success; caseId; policy; passMode?; policyDecision: { canDeploy: boolean; reason?: string; ... };
  isShadowOnly; gateResult: GateResult; previousMonitorVersion; activeMonitorVersion }
```
**400** không có candidate · **404** case không tồn tại.
Chính sách (strict/standard/shadow) do **backend** áp khi nhận request: front-end gửi chính sách người dùng chọn, coi `success: false` là bị từ chối và hiển thị nguyên `policyDecision.reason`.

### 4.4 `POST /api/runs/{runId}/cases/{caseId}/stream` — NDJSON
Body `{ prompt?: string }`. Response `Content-Type: application/x-ndjson`; mỗi dòng là một `DualOracleStreamEvent` (`src/core/stream-types.ts`):
```ts
| { type: "step"; id: StreamStepId; status: "running" | "done" | "error"; label: string; durationMs?: number; data?: {...} }
| { type: "text"; delta: string }                       // token giải thích
| { type: "human_query"; reason: "UND_E" | "UND_C" | "UND_G"; promptText: string; questionType: string }
| { type: "done"; verdict: Verdict; totalMs: number }
| { type: "error"; message: string; step?: StreamStepId }
```
Thứ tự bước: `load_task → run_code → oracle_p0 → oracle_code → adjudicate → fail_closed_check`.

- Backend chạy oracle trên `prompt` của người dùng, và phải bảo đảm luồng luôn kết thúc bằng `done` hoặc `error`.
- Status ≠ 200 (gồm **501**): client đọc `{ error }` và hiện “Chức năng chưa khả dụng: …” kèm nút “Thử lại”. Client không giả lập kết quả.

---

## 5. Human query tickets & Annotation (Focus Mode)

### 5.1 `POST /api/tickets/{ticketId}/answer`
Body `TicketAnswerRequest`:
```ts
{ answer?: unknown;          // true = Chấp nhận, false = Bác bỏ, hoặc chuỗi người dùng nhập
  isUncertain?: boolean;     // "Không xác định được" — vẫn tiêu vé vĩnh viễn
  durationMs?: number }      // thời gian trả lời (đo năng suất gán nhãn)
```
- **200** `TicketAnswerResponse`:
  ```ts
  { success: true; ticket: HumanQueryTicket /* status "spent" */; message: string;
    resolvedVerdict?: Verdict;   // verdict cuối sau khi áp dụng câu trả lời
    explanation?: string }       // lời giải thích cho verdict cuối
  ```
  `resolvedVerdict` là **bắt buộc** khi vé thuộc một case đang ở lượt bổ sung của chat. Thiếu trường này thì `ChatTestbed` báo lỗi “Backend không trả verdict cuối”; client **không** tự suy ra verdict.
- **404** vé không tồn tại
- **409** `{ error, code: "TICKET_ALREADY_SPENT" }` — **single-shot**: mỗi vé chỉ được trả lời một lần

### 5.2 `POST /api/tickets/{ticketId}/defer`
Hoãn vé (giữ `open`, client đẩy về cuối hàng đợi).
**200** `{ success: true, ticketId, status: "open", message }` · **404** vé không tồn tại.

### 5.3 `GET /api/runs/{runId}/annotation-queue`
Hàng đợi gán nhãn cho Focus Mode.
**200** `AnnotationQueueResponse`:
```ts
{ runId: string; seed: string; total: number;
  items: Array<CaseDossier & { ticket: HumanQueryTicket;   // bắt buộc có vé
                               isUniqueOutput: boolean }> } // lấy từ task của case (chỉ để hiển thị)
```
- Chỉ gồm các case có vé **chưa spent**; `ticket.status` là trạng thái hiện tại.
- Dạng câu hỏi do backend quyết định qua `ticket.questionType`: `"expected-output"` (hỏi đầu ra đúng) hoặc `"acceptability"` (hỏi chấp nhận được không). Front-end hiển thị đúng dạng đó, không tự suy ra từ `isUniqueOutput` hay verdict; ca nào được hỏi (chỉ `UNKNOWN_EVIDENCE` / `UNKNOWN_CONFLICT`, mỗi đầu vào một lần) cũng do backend quyết định.
- Thứ tự xáo trộn **tất định** theo `seed` để mọi người gán nhãn thấy cùng một thứ tự.
- Client giữ hàng đợi cục bộ sau lần tải đầu: trả lời thì bỏ phần tử đầu, hoãn thì đẩy về cuối.

---

## 6. Admission (Kiểm nạp 6 bước)

### 6.1 `GET /api/runs/{runId}/admission`
Báo cáo kiểm nạp gần nhất.

### 6.2 `POST /api/runs/{runId}/admission`
Chạy lại kiểm nạp và trả về báo cáo mới (body rỗng). Nếu pipeline chạy lâu, đề xuất trả **202** ngay rồi đẩy tiến độ qua SSE `events` (`admission_step`, `admission_completed`); khi đó front-end gọi lại `GET`.

**200** (cả 6.1 và 6.2) `AdmissionReport`:
```ts
{ runId: string; ranAt: ISO;
  steps: Array<{ index: number; key: string; title: string; description: string;
                 status: "idle" | "running" | "passed" | "warning" | "error";
                 details?: string;
                 hasViolation?: boolean; violatedTaskId?: string;      // bước anchor cross-check
                 silentFaultsCount?: number; silentFaultCases?: string[]; // bước replay
                 slackRatio?: number }>;                                // bước B_synth (%)
  summary: { slackRatio: number; slackCases: number; totalTasks: number;
             silentFaultCases: string[]; admittedTasks: number; excludedTasks: number };
  reviewedTaskIds: string[] }   // các task vi phạm đã được đánh dấu để người kiểm lại
```
6 bước theo thứ tự `key`: `static_checker`, `contract_runner`, `anchor_cross_check`, `silent_fault_replay`, `z3_property_verifier`, `bsynth_slack_measurement`.

### 6.3 `POST /api/runs/{runId}/admission/review`
Body `{ taskId: string }` → **200** `{ runId, reviewedTaskIds: string[] }` · **400** thiếu `taskId`. Thao tác idempotent.

---

## 7. Evidence Store

### 7.1 `GET /api/runs/{runId}/evidence`
Kho bằng chứng **chỉ đọc**. UI không có thao tác ghi nào trên G/B; có test bảo vệ bất biến này.

**200** `EvidenceStoreResponse`:
```ts
{ runId: string;
  good: EvidenceRecord[];     // Tập G
  bad: EvidenceRecord[];      // Tập B
  bSynth: BSynthRecord[];     // Tập B_synth
  metamorphicTree: MetamorphicAnchorNode;   // cây anchor gốc → dẫn xuất qua MR
  specDebt: SpecDebtItem[];
  invariant: { holds: boolean; intersectionCount: number; violatingKeys: string[] } }  // G ∩ B = ∅
```
Kiểu chi tiết ở `src/lib/api/types.ts`:
- `EvidenceRecord = { id, taskId, kind: "expected_output" | "property" | "rejection", source, input, output, verdict: "ACC" | "REJ", timestamp, notes? }`
- `BSynthRecord = { id, taskId, mutationType: "boundary_shift" | "type_perturbation" | "extreme_value" | "null_injection", input, mutantOutput, isCaughtByP0, timestamp }`
- `MetamorphicAnchorNode = { id, taskId, input, expectedOutput, origin: "gốc" | "dẫn xuất", parentId?, metamorphicRelation?, children[] }`
- `SpecDebtItem = { id, taskId, witness, debtType: "unresolved_advisory" | "missing_a2_anchor" | "weak_precondition" | "open_ticket", title, description, severity: "high" | "medium" | "low", recordedAt }`

Bất biến `G ∩ B = ∅` **phải tính ở server** (khoá so sánh `taskId:input->output`). Client chỉ hiển thị kết quả.

---

## 8. Revocation (Thu hồi bản vá)

### 8.1 `GET /api/runs/{runId}/revocation`
**200** `{ runId, monitorHistory: MonitorVersionRecord[] }`
```ts
MonitorVersionRecord = { version: "P_0" | "P_1" | ...; patchId?; guard?; replacement?;
                         status: "active" | "revoked" | "deprecated"; deployedAt: ISO;
                         revokedAt?; revocationReason?; violatingTraceId? }
```

### 8.2 `POST /api/runs/{runId}/revocation` — tiêm vết xấu vào B
Body `{ trace: BadTraceItem }` với `BadTraceItem = { id, input, output, inGuard: boolean, description?, injectedAt: ISO }`. `input`/`output` là JSON do người dùng nhập trong `BadTraceForm` (không còn vết mẫu viết sẵn).
**200** `{ success: true, revocationResult: { revoked: boolean; violatingTrace?; reason?; newActiveVersion? }, currentHistory: MonitorVersionRecord[] }` · **400** `trace` không hợp lệ · **404** run không tồn tại.

---

## 9. Results RQ1–RQ6

### 9.1 `GET /api/runs/{runId}/results/{rq}`
`rq ∈ rq1 … rq6` (không phân biệt hoa thường). **404** nếu `rq` không hợp lệ.

**200** `RQResultResponse`:
```ts
{ runId: string; rq: RQId; title: string; description: string; sampleSize: number;
  table: { headers: string[]; rows: Array<Array<string | number>> };   // chế độ “Xem dạng bảng” + xuất CSV/LaTeX
  data: RQData }                                                        // dữ liệu biểu đồ
```
`RQData` là union phân biệt theo `rq` (kiểu chi tiết ở `src/reporting/results-data.ts`):

| rq | Payload `data` |
|---|---|
| rq1 | `{ rq: "rq1", categories: RQ1Category[] }` — `{ category, beforeCount, afterCount, reductionRatio, witnesses[] }` |
| rq2 | `{ rq: "rq2", methods: RQ2MethodData[], confusionMatrix: ConfusionMatrixRow[] }` |
| rq3 | `{ rq: "rq3", cells: AblationCell[] }` — anchorLevel × source |
| rq4 | `{ rq: "rq4", cells: ModelCorrelationCell[] }` — coder × spec |
| rq5 | `{ rq: "rq5", suite: RQ5Metric[], unknownGateBreakdown: UnknownGateDecomposition[] }` |
| rq6 | `{ rq: "rq6", strategies: RQ6Strategy[] }` — mỗi strategy có `points[]` (`residualRisk` theo số câu hỏi) |

Mỗi điểm dữ liệu có thể mang `witnesses: LinkedWitness[]` (`{ caseId, taskId, witnessPreview, verdict, note? }`). Khi bấm vào một phần tử biểu đồ, UI mở drawer witness và link `/runs/{runId}/workbench?caseId=…`. Backend phải giữ đúng `caseId` thật.

- Trục của heatmap RQ3 (mức anchor × nguồn) và RQ4 (coder × spec) được **suy ra từ `cells`**, nên backend quyết định danh sách nguồn/model.
- Số liệu tổng hợp từ kết quả thực nghiệm thật của run. `sampleSize < 30` thì UI tự cảnh báo cỡ mẫu nhỏ.
- Chưa có kết quả thực nghiệm thì trả **501** hoặc 404 kèm `error`, không trả số liệu minh hoạ.

---

## 10. Experiments (Batch Runner)

`ExperimentConfig`:
```ts
{ datasetId: string; heldOutRatio: number /* (0,1) */; coderModel: string; specModel: string;
  anchorLevel: "A0" | "A1" | "A2" | "A3"; policy: "strict" | "standard" | "shadow";
  unknownMode: "closed" | "open"; humanOracle: "off" | "perfect" | "noise_5" | "noise_10" | "real_human";
  baselines: string[]; seed: string }
```
Backend validate đầy đủ các enum trên và `heldOutRatio ∈ (0,1)`.

### 10.1 `GET /api/experiments/options`
**200** `ExperimentOptionsResponse`:
```ts
{ datasets: Array<{ id; name; taskCount; heldOutRatio; isHeldOutLocked }>;
  models: Array<{ id; name; family }>;       // family dùng để cảnh báo thiên kiến cùng họ
  baselines: string[];
  anchorLevels: ("A0" | "A1" | "A2" | "A3")[];
  defaults: ExperimentConfig }               // giá trị khởi tạo form (nên lấy model mặc định từ /api/settings)
```
Front-end không có cấu hình mặc định viết cứng: form chỉ hiện sau khi có `defaults`.

### 10.2 `POST /api/experiments/plan`
Body `{ config: ExperimentConfig }`. Client gọi lại mỗi khi form đổi (request cũ bị huỷ).
**200** `ExperimentPlanResponse`:
```ts
{ familyCheck: { isSameFamily: boolean; warning?: string };
  costEstimate: { functionCalls; llmDurationSec; z3DurationSec; totalTokens; estimatedUsd };
  manifest: { manifestHash; config; totalTasks; runTaskCount; heldOutTaskCount; initialMonitorVersion; estimatedCost; partitionChecksum } }
```
**400** `{ error }` cấu hình sai. Yêu cầu: **tất định**, cùng config thì cùng `manifestHash`.

### 10.3 `POST /api/experiments`
Body `{ config }` → **201** `ExperimentStatusResponse` · **400**.

### 10.4 `GET /api/experiments/{experimentId}`
Client poll mỗi 500 ms cho tới khi `status === "completed"`.
**200** `ExperimentStatusResponse`:
```ts
{ experimentId: string; status: "running" | "completed"; config: ExperimentConfig; manifestHash: string;
  progress: { completed; total; accCount; rejCount; unknownCount; repairCount; revocations; pendingHumanTickets } }
```
**404** không tồn tại.

Backend chạy batch bằng job queue/worker và lưu tiến độ bền vững. Khi `humanOracle = "real_human"`, các vé đếm trong `pendingHumanTickets` phải xuất hiện trong `/annotation-queue`.

---

## 11. Fault Injection

### 11.1 `GET /api/fault-injection`
**200** `FaultInjectionStateResponse`:
```ts
{ options: { specFaults: Option[]; codeFaults: Option[]; trustedFaults: Option[] };  // Option = { value, label }
  defaults: { specFault; codeFault; trustedFault };
  metrics: FaultInjectionMetrics }   // số liệu nền trước khi chạy
```
Danh mục kiểu lỗi do backend quyết định; UI render đúng các `options` nhận được. Bộ giá trị gợi ý (theo bài báo):
- `specFault`: `over_tight` | `under_tight` | `semantic_flip`
- `codeFault`: `off_by_one` | `operator_flip` | `extreme_input`
- `trustedFault`: `none` | `mr_corrupt` | `docstring_corrupt` | `a3_conflict`

### 11.2 `POST /api/fault-injection`
Body `{ specFault, codeFault, trustedFault }` → **200** `{ profile, metrics: FaultInjectionMetrics, ranAt }` · **400** profile sai.
```ts
FaultInjectionMetrics = { misattributionRate: number /* % */; faultyPatchSlipRate: number /* % */;
                          gateBlockedCount: number; totalInjections: number }
```
Backend sinh đột biến theo cả 3 khu, chạy adjudicator và gate trên N ca rồi đo. Nếu chạy lâu, nên chuyển sang job + polling giống Experiments.

---

## 12. Settings

### 12.1 `GET /api/settings`
**200** `SettingsResponse` → `{ settings: LabSettings, models: ModelOption[], updatedAt?: ISO }`.

### 12.2 `PUT /api/settings`
Body: `LabSettings` đầy đủ (ghi đè toàn bộ):
```ts
{ defaultCoderModel: string; defaultSpecModel: string;
  maxCallsBudget: int > 0; maxTokensBudget: int > 0;
  a3TimeoutMs: int > 0; z3TimeoutMs: int > 0;
  enableFlaky: boolean; enableAudit: boolean; enableBSynth: boolean }
```
**200** `SettingsResponse` · **400** sai kiểu **hoặc có trường lạ**. Schema là `.strict()`: mọi trường như `apiKey` đều bị từ chối. Đây là **bất biến bảo mật**, đã có test bảo vệ.

Backend lưu bền vững và kiểm tra `defaultCoderModel`/`defaultSpecModel` có nằm trong danh mục `models`.

---

## Phụ lục A — Bản đồ component ↔ API

```
src/app/                 route mỏng: page.tsx chỉ render Screen; layout.tsx gắn <Providers> (cấu hình LLM)
  api/[...path]/route.ts proxy duy nhất → src/lib/server/backend-proxy.ts → ${BACKEND_URL}
src/lib/api/
  client.ts              apiRequest, apiRequestText, readSse, ApiError, withQuery, toDisplayError (giữ status 501)
  endpoints.ts           api.{chat,datasets,runs,stats,evidence,results,experiments,faultInjection,settings}
  types.ts               DTO — hợp đồng với backend
  use-api-query.ts       hook đọc dữ liệu (huỷ request cũ, reload, setData sau mutation, errorStatus)
src/core/                kiểu dữ liệu thuần (không React/Next): types, schema, experiment, results
src/features/<feature>/
  <Feature>Screen.tsx    màn hình (client), lấy dữ liệu qua useApiQuery + api.*
  components/*.tsx       component trình bày, chỉ dùng trong feature đó
  use-*.ts               hook riêng của feature
src/features/runs/       RunGate (lấy [runId] trên URL, không có thì GET /api/runs/current), useRouteParam
src/ui/
  shell/                 AppShell, Sidebar (thu/phóng), Topbar, InvariantBar, ShellPage, use-theme
  layout/                PageHeader, Panel, MetricTile, Notice, Badge, QueryBoundary, ErrorState (501 → "chưa khả dụng")
  primitives/            Button, Field
src/i18n/vi.ts           toàn bộ chuỗi giao diện
src/styles/              tokens.css (công thức OKLCH), globals.css
```

| Feature | Screen | API |
|---|---|---|
| shell | `Topbar`, `RunGate` | 2.4, 2.6 |
| chat | `ChatScreen` (`/`) | 0, 1.1, 1.2 |
| evidence | `EvidenceScreen` | 7.1 |
| results | `ResultsScreen` | 9.1 |
| experiments | `ExperimentsScreen` | 10.1–10.4 |
| fault-injection | `FaultInjectionScreen` | 11.1, 11.2 |
| settings | `SettingsScreen` | 12.1, 12.2 |
| history | `HistoryScreen`, `RunDetailScreen` | 2.1, 2.3, 2.5, 2.8, 2.10 |
| stats | `StatsScreen` | 2.12 |

## Phụ lục B — Kiểm thử hợp đồng

- `tests/api/backend-proxy.test.ts`: proxy chuyển đúng method/path/query/body, trả 503 khi thiếu `BACKEND_URL`, 502 khi backend không kết nối được, giữ nguyên 501, truyền thẳng stream, lọc `grading`.
- `tests/ui/chat.test.tsx`: trang Hỏi đáp chọn dataset/tác vụ, gửi đúng body `POST /api/run`, không hỏi khi đã có kết luận, hỏi đúng một lần khi `unknown` (`POST /api/run/followup`), không ghi key vào bộ nhớ trình duyệt.
- `tests/helpers/api-routes.ts` + `tests/fixtures/api.ts`: giả lập backend ở tầng `fetch` bằng response đúng hợp đồng này (fixture **chỉ** dùng trong test, app không import). Test UI kiểm tra cả trạng thái 501 “chưa khả dụng”.
- Khi đổi hợp đồng: sửa `src/lib/api/types.ts`, rồi tới fixture test và tài liệu này.
