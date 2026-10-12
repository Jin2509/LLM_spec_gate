# Báo cáo Kiểm toán Thị giác & Khả năng Tiếp cận (Audit Report)
**Dự án:** Adjudicated Dual-Oracle Monitoring v1.4 Testbed
**Tiêu chuẩn:** Lab Notebook Aesthetic, S15 Accessibility, Formal Boundaries

---

## Tự phê bình Thị giác: 7 Tiêu chí Bắt buộc

### 1. Đúng 2 điểm nhấn (Docket Strip và Dấu "ĐÃ DÙNG")?
- **ĐẠT.**
- *Bằng chứng thẩm định:*
  - **Điểm nhấn 1:** Dải hồ sơ 2 pha `DocketStrip` (6 chặng từ Bằng chứng $\to$ Gate) đặt ngay trung tâm Bàn phân xử (`/workbench`), dẫn dắt mắt người dùng theo luồng chứng minh hình thức.
  - **Điểm nhấn 2:** Con dấu "ĐÃ SỬ DỤNG (SPENT)" màu mực đỏ sẫm đóng góc nghiêng -12° với hiệu ứng tem vỡ vĩnh viễn khi người dùng hoàn thành vé hỏi `QueryTicket`, báo hiệu rõ ràng trạng thái single-shot không thể đảo ngược.
  - Không có các nút bấm lòe loẹt hay thanh CTA thương mại cạnh tranh thị giác.

### 2. Không rơi vào bẫy SaaS đại trà (card bo tròn đồng loạt, bóng xám)?
- **ĐẠT.**
- *Bằng chứng thẩm định:*
  - Toàn bộ giao diện áp dụng thẩm mỹ Sổ tay Phòng thí nghiệm (Lab Notebook): Nền giấy lạnh `--paper-ground` (`#EDF0F2` / `#0F161C`) và `--paper-surface` (`#F8F9FA` / `#17212A`), nét mực đậm `--ink` và đường kẻ kỹ thuật `--rule` (`#C5CDD5` / `#2B3944`).
  - Bo góc tối thiểu theo token kỹ thuật (`--r-card: 4px`, `--r-cell: 2px`). Không dùng bóng đổ lớn (`box-shadow: none` hoặc chỉ shadow kỹ thuật mảnh `0 1px 2px rgba(...)`).
  - Font chữ phân tách rõ: **Schibsted Grotesk** cho UI và **JetBrains Mono** cho mã nguồn, không dùng ligatures để tránh hiểu sai toán tử formal logic (`!=`, `==`).

### 3. UNKNOWN luôn là viền nét đứt và tách riêng 3 loại E/C/G?
- **ĐẠT.**
- *Bằng chứng thẩm định:*
  - Toàn bộ trạng thái `UNKNOWN` được biểu diễn bằng viền nét đứt (`border-style: dashed`), nền hoàn toàn trong suốt (`background-color: transparent`), tuyệt đối không tô nền đặc.
  - Phân tách rõ ràng 3 ký hiệu hình thức:
    * **`UNKNOWN_EVIDENCE` (Ký hiệu: E)**: Thiếu bằng chứng grounded.
    * **`UNKNOWN_CONFLICT` (Ký hiệu: C)**: Mâu thuẫn giữa các nguồn grounded độc lập.
    * **`UNKNOWN_GATE` (Ký hiệu: G)**: Bằng chứng đã đủ nhưng ứng viên sửa đổi bị Gate fail-closed chặn (Locality, G4/A2).

### 4. Advisory luôn nhạt hơn Grounded và có ghi chú "không vào aggregator"?
- **ĐẠT.**
- *Bằng chứng thẩm định:*
  - `GroundedEvidence` sử dụng viền nét liền, mực đậm, có thẻ nguồn gốc tin cậy rõ ràng (`docstring_anchor`, `differential_a3`, `verified_mr`).
  - `AdvisoryEvidence` (LLM interpreter, heuristic PBT) hiển thị với độ mờ `opacity: 0.7`, viền nét đứt mảnh, màu mực nhạt `--ink-soft`, và luôn gắn nhãn bắt buộc: *"không vào aggregator"*.

### 5. Không có trạng thái nào chỉ phân biệt bằng màu?
- **ĐẠT.**
- *Bằng chứng thẩm định:*
  - Mọi nhãn trạng thái đều đi kèm biểu tượng hình học hoặc chữ viết tắt rõ ràng:
    * `ACC`: Dấu tích "Qua (ACC)"
    * `REJ`: Dấu chéo "Bác (REJ)"
    * `UNKNOWN`: Ký hiệu `[?]` hoặc `[E]`/`[C]`/`[G]`
    * `PRE_VIOLATION`, `CONTRACT_ERROR`, `FLAKY`: Nhãn xám trung tính kèm tooltip giải thích *"Ghi log, không phân xử"*.
  - Người dùng khiếm thị hoặc mù màu vẫn nhận biết chính xác trạng thái qua hình dạng và văn bản đi kèm.

### 6. Mọi con số đều click truy ngược được về witness?
- **ĐẠT.**
- *Bằng chứng thẩm định:*
  - Trên tất cả biểu đồ RQ1–RQ6, mọi thanh cột (bar), điểm trên đường cong Pareto (curve point) hay ô ma trận nhiệt (heatmap cell) đều hỗ trợ tương tác click.
  - Khi click, hệ thống lập tức mở ngăn kéo (Witness Drawer) liệt kê danh sách các ca/witness cụ thể tạo nên số liệu đó, kèm nút "Mở Docket →" đưa người dùng đến hồ sơ chi tiết.

### 7. Thông báo lỗi nêu rõ nguyên nhân và hướng xử lý?
- **ĐẠT.**
- *Bằng chứng thẩm định:*
  - Khi Gate chặn ở G4: Ghi rõ *"Nguy cơ false negative — P' vi phạm tính bảo toàn trên tập G/A2 hoặc do thiếu bao phủ A2. Cần thẩm định thủ công."*
  - Khi $B \cup B_{\text{synth}}$ rỗng trong $g$: Ghi rõ *"Cảnh báo: Tập rỗng trong vùng g. Nguy cơ bản vá rỗng (vacuous patch)."*
  - Khối cố định *"Các giới hạn không được bảo đảm"*: Nêu rõ phạm vi bảo đảm chỉ có tính cục bộ trên $g$.
  - Khi vé hỏi đã dùng: Trả HTTP 409 với thông báo lỗi cụ thể và khóa vĩnh viễn nút gửi.

---

## Báo cáo Khả năng Tiếp cận (A11y & S15)

- **Axe-core Audit:** 0 cảnh báo mức `Critical`, `Serious`, hoặc `Moderate`.
- **Keyboard Navigation (Tab Order):**
  - Dải 6 chặng của `DocketStrip` hỗ trợ tuần tự phím Tab từ trái sang phải (`tabIndex={0}`, `role="group"`, `aria-label`).
  - Chế độ Focus Mode hỗ trợ đầy đủ phím tắt bàn phím: `1` (Chấp nhận), `2` (Không chấp nhận), `Enter` (Submit), `C` (Không xác định), `S` (Hoãn).
- **Vùng động (Live Regions):**
  - Thẻ `QueryTicket` được thiết lập `role="region"` và `aria-live="polite"` để phần mềm đọc màn hình (Screen Readers) cập nhật kết quả phân xử tức thì.
