/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT - NHẬN DỮ LIỆU ĐẶT XE TỪ LANDING PAGE VÀO GOOGLE SHEETS
 * ==============================================================================
 * HƯỚNG DẪN CÀI ĐẶT TRONG 2 PHÚT:
 * 1. Mở Google Trang tính (Google Sheets) mới tại: https://sheets.new
 * 2. Đặt tên trang tính, ví dụ: "KHÁCH ĐẶT XE TIỆN CHUYẾN"
 * 3. Trên menu Google Sheets, bấm vào: Tiện ích mở rộng (Extensions) -> Apps Script
 * 4. Xóa hết code cũ trong màn hình Apps Script, dán toàn bộ đoạn mã bên dưới vào
 * 5. Bấm biểu tượng "Lưu" (Ctrl + S hoặc hình đĩa mềm)
 * 6. Bấm nút "Triển khai" (Deploy) màu xanh ở góc trên bên phải -> Chọn "Tùy chọn triển khai mới" (New deployment)
 * 7. Bấm biểu tượng bánh răng cạnh "Chọn loại" -> Chọn "Ứng dụng web" (Web app)
 * 8. Điền cấu hình:
 *    - Mô tả: "Dat xe web app"
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)  <--- BẮT BUỘC CHỌN ANYONE
 * 9. Bấm "Triển khai" (Deploy) -> Cấp quyền truy cập nếu Google yêu cầu.
 * 10. Copy đường dẫn "URL ứng dụng web" (Web App URL) có dạng:
 *     https://script.google.com/macros/s/AKfycb.../exec
 * 11. Mở file `js/main.js` của trang web, dán URL vừa copy vào biến GOOGLE_SHEET_URL ở dòng đầu tiên!
 * ==============================================================================
// ==============================================================================
// CẤU HÌNH BẮN THÔNG BÁO VỀ TELEGRAM (MIỄN PHÍ - NỔ CHUÔNG ĐIỆN THOẠI NGAY)
// ==============================================================================
var TELEGRAM_BOT_TOKEN = "DIEN_BOT_TOKEN_VAO_DAY"; // Ví dụ: "7123456789:AAFl..."
var TELEGRAM_CHAT_ID   = "DIEN_CHAT_ID_VAO_DAY";   // Ví dụ: "123456789"
// ==============================================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Tránh ghi đè khi nhiều người gửi cùng lúc

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Nếu trang tính chưa có tiêu đề cột, tạo hàng tiêu đề tự động
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Thời Gian Đặt",
        "Họ Và Tên",
        "Số Điện Thoại",
        "Điểm Đón",
        "Điểm Đến",
        "Loại Dịch Vụ",
        "Loại Xe",
        "Thời Gian Đi",
        "Ghi Chú",
        "Trạng Thái"
      ]);
      // Định dạng màu nền cho dòng tiêu đề
      var headerRange = sheet.getRange(1, 1, 1, 10);
      headerRange.setBackground("#0d6efd");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
    }

    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }

    // Lấy thông tin từ form
    var hoTen = data.ho_ten || data.name || "Khách đặt nhanh";
    var dienThoai = data.dien_thoai || data.phone || "";
    var diemDon = data.diem_don || data.pickup || "";
    var diemDen = data.diem_den || data.dropoff || "";
    var loaiDichVu = data.loai_xe || data.service_type || "Chưa chọn";
    var tuyChonXe = data.tuy_chon_xe || data.car_type || "Chưa chọn";
    var thoiGian = data.thoi_gian || data.time || "";
    var ghiChu = data.ghi_chu || data.note || "";
    var thoiGianGui = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "HH:mm:ss dd/MM/yyyy");

    // Thêm dòng mới vào Google Sheet
    sheet.appendRow([
      thoiGianGui,
      hoTen,
      "'" + dienThoai, // Dấu nháy đơn để giữ số 0 đầu số điện thoại
      diemDon,
      diemDen,
      loaiDichVu,
      tuyChonXe,
      thoiGian,
      ghiChu,
      "Mới nhận - Chờ gọi"
    ]);

    // Gửi thông báo nổ chuông về Telegram nếu đã cấu hình
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID && TELEGRAM_BOT_TOKEN !== "DIEN_BOT_TOKEN_VAO_DAY") {
      try {
        sendTelegramNotification(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, {
          hoTen: hoTen,
          dienThoai: dienThoai,
          diemDon: diemDon,
          diemDen: diemDen,
          loaiDichVu: loaiDichVu,
          tuyChonXe: tuyChonXe,
          thoiGian: thoiGian,
          ghiChu: ghiChu,
          thoiGianGui: thoiGianGui
        });
      } catch (tgError) {
        Logger.log("Lỗi gửi Telegram: " + tgError.toString());
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Đã lưu thành công" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "alive", message: "Google Apps Script Đặt Xe đang hoạt động bình thường!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Hàm gửi tin nhắn thông báo về Telegram
 */
function sendTelegramNotification(token, chatId, info) {
  var url = "https://api.telegram.org/bot" + token + "/sendMessage";
  var text = "🚖 <b>CÓ KHÁCH ĐẶT XE MỚI!</b>\n" +
             "━━━━━━━━━━━━━━━━━━━\n" +
             "👤 <b>Khách hàng:</b> " + info.hoTen + "\n" +
             "📞 <b>Điện thoại:</b> <code>" + info.dienThoai + "</code>\n" +
             "📍 <b>Điểm đón:</b> " + info.diemDon + "\n" +
             "🎯 <b>Điểm đến:</b> " + info.diemDen + "\n" +
             "🚗 <b>Dịch vụ:</b> " + info.loaiDichVu + " (" + info.tuyChonXe + ")\n" +
             "⏰ <b>Giờ đi:</b> " + info.thoiGian + "\n" +
             "📝 <b>Ghi chú:</b> " + (info.ghiChu || "Không có") + "\n" +
             "━━━━━━━━━━━━━━━━━━━\n" +
             "🕒 <i>Đặt lúc: " + info.thoiGianGui + "</i>";

  var payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML"
  };

  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
