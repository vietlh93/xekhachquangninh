# HƯỚNG DẪN LIÊN KẾT FORM ĐẶT XE VÀO GOOGLE SHEETS

Chỉ mất **2 phút** để hoàn tất cài đặt giúp thông tin khách đặt xe từ Landing Page tự động đổ về file Excel Google Sheet trên điện thoại và máy tính của bạn ngay lập tức!

---

### BƯỚC 1: TẠO FILE GOOGLE SHEET MỚI
1. Truy cập vào trang: [https://sheets.new](https://sheets.new) trên trình duyệt.
2. Đổi tên file ở góc trên bên trái, ví dụ: **"DANH SÁCH KHÁCH ĐẶT XE TIỆN CHUYẾN"**.

---

### BƯỚC 2: MỞ APPS SCRIPT VÀ DÁN MÃ CODE
1. Trên thanh menu trên cùng của Google Sheet, bấm vào **Tiện ích mở rộng** (Extensions) -> Chọn **Apps Script**.
2. Một tab mới sẽ mở ra. Xóa sạch tất cả các chữ đang có trong ô soạn thảo code.
3. Mở file `GoogleAppsScript.js` (trong thư mục dự án này), **copy toàn bộ nội dung** và **dán** vào màn hình Apps Script.
4. Bấm biểu tượng **Lưu** (hình đĩa mềm hoặc phím tắt `Ctrl + S`).

---

### BƯỚC 3: TRIỂN KHAI THÀNH WEB APP (QUAN TRỌNG)
1. Ở góc trên bên phải màn hình Apps Script, bấm vào nút màu xanh **Triển khai** (Deploy) -> Chọn **Tùy chọn triển khai mới** (New deployment).
2. Tại bảng hiện ra, nhìn bên trái có biểu tượng bánh răng ⚙️ cạnh chữ "Chọn loại" -> Chọn **Ứng dụng web** (Web app).
3. Điền các trường như sau:
   - **Mô tả (Description):** `Web Dat Xe`
   - **Thực thi dưới dạng (Execute as):** Chọn **Tôi (Địa chỉ email của bạn)**
   - **Ai có quyền truy cập (Who has access):** Chọn **Bất kỳ ai (Anyone)**  *(Lưu ý: BẮT BUỘC chọn "Bất kỳ ai" thì form trên web mới gửi dữ liệu vào sheet được)*.
4. Bấm nút **Triển khai** (Deploy) màu xanh.
5. Google sẽ hỏi cấp quyền truy cập:
   - Bấm **Ủy quyền truy cập** (Authorize access) -> Chọn tài khoản Google của bạn.
   - Nếu thấy cảnh báo "Google chưa xác minh ứng dụng này" -> Bấm vào chữ **Nâng cao** (Advanced) ở dưới -> Bấm tiếp **Đi tới [Tên dự án] (không an toàn)**.
   - Bấm **Cho phép** (Allow).
6. Google sẽ hiện bảng chứa đường dẫn **URL ứng dụng web** (Web app URL) có dạng:
   `https://script.google.com/macros/s/AKfycb.../exec`
7. Bấm **Sao chép** (Copy) đường dẫn URL này.

---

### BƯỚC 4: DÁN URL VÀO WEB
1. Mở file `js/main.js` trong thư mục dự án.
2. Ở dòng số 2, bạn sẽ thấy:
   ```javascript
   const GOOGLE_SHEET_URL = "DÁN_URL_WEB_APP_GOOGLE_APPS_SCRIPT_CỦA_BẠN_VÀO_ĐÂY";
   ```
3. Thay thế dòng chữ trong ngoặc kép bằng URL vừa copy. Ví dụ:
   ```javascript
   const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxxxxxxxxxxx/exec";
   ```
4. Bấm **Lưu file** (`Ctrl + S`).

---

### BƯỚC 5: KIỂM TRA THỬ NGHIỆM
1. Mở file `index.html` trên trình duyệt.
2. Điền thông tin thử vào form (Tên, SĐT, Điểm đón, Điểm đến, Giờ đi).
3. Bấm **"Gửi Yêu Cầu Đặt Xe"**.
4. Mở lại file Google Sheet của bạn: Dữ liệu khách đặt sẽ ngay lập tức xuất hiện thành từng cột rõ ràng!

> **Mẹo hay cho chạy quảng cáo Google Ads:**
> Bạn có thể cài ứng dụng **Google Trang tính (Google Sheets)** trên điện thoại và bật thông báo. Mỗi khi có khách đặt xe trên web, bạn sẽ nhận được thông báo ngay để gọi chốt khách chỉ trong 30 giây!
