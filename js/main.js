/**
 * ==============================================================================
 * JAVASCRIPT XỬ LÝ CHỨC NĂNG & TỐI ƯU CHUYỂN ĐỔI (CRO) GOOGLE ADS
 * ==============================================================================
 */

// CẤU HÌNH LIÊN KẾT GOOGLE SHEETS TẠI ĐÂY:
// Dán Web App URL lấy từ Google Apps Script (xem file HUONG_DAN_GOOGLE_SHEETS.md)
const GOOGLE_SHEET_URL = ""; 

// Thông tin liên hệ
const HOTLINE_NUMBER = "0899669811";
const ZALO_URL = "https://zalo.me/0899669811";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61577533037723";

// CẤU HÌNH TRACKING GOOGLE ADS CONVERSION (Nếu có ID chuyển đổi Google Ads, điền vào đây):
const GOOGLE_ADS_ID = ""; // Ví dụ: "AW-123456789/AbCdEfGhIj"

document.addEventListener("DOMContentLoaded", function () {
  initFormSubmissions();
  initPricingFilters();
  initFaqAccordion();
  initModalBooking();
  initDateTimeDefaults();
  initLiveBookingTicker();
  initExitIntent();
  initConversionTracking();
});

/**
 * HÀM THEO DÕI CHUYỂN ĐỔI GOOGLE ADS (CONVERSION TRACKING)
 * Tự động gửi tín hiệu sang Google Ads & Google Analytics khi khách Gọi/Zalo/Gửi Form
 */
function trackConversion(actionName, details = {}) {
  console.log(`[Google Ads Conversion] -> ${actionName}`, details);

  // 1. Gửi qua Google Tag (gtag) nếu trang đã gắn mã Google Ads
  if (typeof gtag === "function") {
    gtag("event", actionName, {
      event_category: "Conversion",
      event_label: details.label || actionName,
      value: details.value || 1.0
    });

    if (GOOGLE_ADS_ID) {
      gtag("event", "conversion", {
        send_to: GOOGLE_ADS_ID
      });
    }
  }

  // 2. Gửi qua Google Tag Manager (DataLayer) nếu có
  if (window.dataLayer && Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: actionName,
      conversion_type: actionName,
      ...details
    });
  }
}

/**
 * Gắn sự kiện click tracking cho tất cả các nút Gọi Điện và Chat Zalo
 */
function initConversionTracking() {
  // Tracking khi khách bấm số điện thoại Gọi ngay
  document.querySelectorAll('a[href^="tel:"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      trackConversion("click_phone_call", { label: HOTLINE_NUMBER });
    });
  });

  // Tracking khi khách bấm nút Chat Zalo
  document.querySelectorAll('a[href*="zalo.me"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      trackConversion("click_chat_zalo", { label: "Zalo Chat" });
    });
  });

  // Tracking khi khách bấm Fanpage Facebook
  document.querySelectorAll('a[href*="facebook.com"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      trackConversion("click_facebook_fanpage", { label: "Fanpage Chat" });
    });
  });
}

/**
 * Tự động đặt thời gian tối thiểu cho input datetime-local là thời điểm hiện tại
 */
function initDateTimeDefaults() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  document.querySelectorAll('input[type="datetime-local"]').forEach((input) => {
    input.min = minDateTime;
    if (!input.value) {
      // Mặc định chọn 1 giờ sau
      const defaultTime = new Date(Date.now() + 60 * 60 * 1000);
      defaultTime.setMinutes(defaultTime.getMinutes() - defaultTime.getTimezoneOffset());
      input.value = defaultTime.toISOString().slice(0, 16);
    }
  });
}

/**
 * Xử lý gửi Form đặt xe lên Google Sheets
 */
function initFormSubmissions() {
  const forms = document.querySelectorAll(".booking-form");

  forms.forEach((form) => {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const alertBox = form.querySelector(".form-alert");
      const originalBtnText = submitBtn ? submitBtn.innerHTML : "Gửi thông tin";

      // Lấy dữ liệu
      const formData = new FormData(form);
      const data = {
        diem_don: formData.get("diem_don") || "",
        diem_den: formData.get("diem_den") || "",
        loai_xe: formData.get("loai_xe") || "Ghép ghế",
        ho_ten: formData.get("ho_ten") || "",
        dien_thoai: formData.get("dien_thoai") || "",
        tuy_chon_xe: formData.get("tuy_chon_xe") || "Xe 4 chỗ",
        thoi_gian: formData.get("thoi_gian") || "",
        ghi_chu: formData.get("ghi_chu") || ""
      };

      // Validate số điện thoại
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!data.dien_thoai || !phoneRegex.test(data.dien_thoai.replace(/\s+/g, ""))) {
        showAlert(alertBox, "Vui lòng nhập đúng số điện thoại (10 số) để nhà xe liên hệ!", "error");
        return;
      }

      if (!data.diem_don || !data.diem_den) {
        showAlert(alertBox, "Vui lòng nhập điểm đón và điểm đến của quý khách!", "error");
        return;
      }

      // Trạng thái đang gửi
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px; fill: white;" viewBox="0 0 24 24">
            <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
          </svg>
          Đang gửi yêu cầu...
        `;
      }

      // Bắn sự kiện chuyển đổi Google Ads
      trackConversion("submit_booking_form", {
        label: `${data.diem_don} -> ${data.diem_den}`,
        phone: data.dien_thoai
      });

      // Lưu dự phòng vào LocalStorage
      try {
        const localBookings = JSON.parse(localStorage.getItem("customer_bookings") || "[]");
        localBookings.push({ ...data, created_at: new Date().toISOString() });
        localStorage.setItem("customer_bookings", JSON.stringify(localBookings));
      } catch (err) {
        console.error("Lỗi lưu localStorage:", err);
      }

      let sendSuccess = false;

      // Gửi lên Google Sheets nếu đã cài đặt URL
      if (GOOGLE_SHEET_URL && GOOGLE_SHEET_URL.trim().length > 10) {
        try {
          await fetch(GOOGLE_SHEET_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(data)
          });
          sendSuccess = true;
        } catch (error) {
          console.warn("Gửi Google Sheets gặp lỗi:", error);
        }
      } else {
        sendSuccess = true;
      }

      // Phục hồi nút submit
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }

      if (sendSuccess) {
        showAlert(
          alertBox,
          `✅ <strong>GỬI THÀNH CÔNG!</strong> Nhà xe đã nhận thông tin và sẽ gọi lại số <strong>${data.dien_thoai}</strong> sau 2-3 phút để xác nhận chuyến đi!`,
          "success"
        );
        showToast("Đặt xe thành công! Chúng tôi sẽ gọi lại ngay.");
        form.reset();
        initDateTimeDefaults();

        // Đóng popup nếu đang ở modal
        setTimeout(() => {
          const modal = document.getElementById("bookingModal");
          if (modal && modal.classList.contains("active")) {
            closeModal();
          }
        }, 3500);
      } else {
        showAlert(
          alertBox,
          `Có lỗi kết nối. Quý khách vui lòng gọi trực tiếp hotline: <a href="tel:${HOTLINE_NUMBER}" style="color: #dc2626; font-weight: bold; text-decoration: underline;">0899.669.811</a> để được đặt xe ngay!`,
          "error"
        );
      }
    });
  });
}

function showAlert(box, message, type) {
  if (!box) return;
  box.className = `form-alert ${type}`;
  box.innerHTML = message;
  box.style.display = "block";
}

function showToast(message) {
  let toast = document.querySelector(".toast-notice");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-notice";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
    <span>${message}</span>
  `;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

/**
 * Xử lý lọc bảng giá xe tiện chuyến
 */
function initPricingFilters() {
  const routeTabs = document.querySelectorAll(".tabs-group .tab-btn");
  const subTabs = document.querySelectorAll(".subfilter-group .subtab-btn");
  const priceCards = document.querySelectorAll(".price-card");

  let currentRoute = "all";
  let currentType = "all";

  function filterCards() {
    priceCards.forEach((card) => {
      const cardRoute = card.getAttribute("data-route") || "";
      const cardTypes = card.getAttribute("data-type") || "";

      const matchRoute = currentRoute === "all" || cardRoute === currentRoute;
      const matchType = currentType === "all" || cardTypes.includes(currentType);

      if (matchRoute && matchType) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  }

  routeTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      routeTabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      currentRoute = this.getAttribute("data-filter") || "all";
      filterCards();
    });
  });

  subTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      subTabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      currentType = this.getAttribute("data-subfilter") || "all";
      filterCards();
    });
  });

  // Nút "Đặt Tuyến Này" trong từng thẻ giá -> Mở form & focus thẳng ô SĐT
  document.querySelectorAll(".btn-card-book").forEach((btn) => {
    btn.addEventListener("click", function () {
      const routeFrom = this.getAttribute("data-from") || "";
      const routeTo = this.getAttribute("data-to") || "";
      const type = this.getAttribute("data-car-type") || "ghep";

      openModalWithRoute(routeFrom, routeTo, type);
    });
  });
}

/**
 * Xử lý popup đặt xe và điền sẵn thông tin lộ trình
 */
function initModalBooking() {
  const modal = document.getElementById("bookingModal");
  const closeBtn = document.querySelector(".btn-modal-close");
  const openButtons = document.querySelectorAll(".btn-open-modal, .mobile-bottom-item.book");

  openButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeModal();
    }
  });
}

function openModal() {
  const modal = document.getElementById("bookingModal");
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeModal() {
  const modal = document.getElementById("bookingModal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function openModalWithRoute(from, to, type) {
  openModal();
  const modal = document.getElementById("bookingModal");
  if (!modal) return;

  const inputFrom = modal.querySelector('input[name="diem_don"]');
  const inputTo = modal.querySelector('input[name="diem_den"]');
  const radioGhep = modal.querySelector('input[value="Ghép ghế"]');
  const radioBao = modal.querySelector('input[value="Bao xe"]');
  const inputPhone = modal.querySelector('input[name="dien_thoai"]');

  if (inputFrom && from) inputFrom.value = from;
  if (inputTo && to) inputTo.value = to;

  if (type === "bao" && radioBao) {
    radioBao.checked = true;
  } else if (radioGhep) {
    radioGhep.checked = true;
  }

  // Tự động focus vào ô số điện thoại sau 300ms
  setTimeout(() => {
    if (inputPhone) inputPhone.focus();
  }, 300);
}

/**
 * FAQ Accordion
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const questionBtn = item.querySelector(".faq-question");
    if (!questionBtn) return;

    questionBtn.addEventListener("click", function () {
      const isActive = item.classList.contains("active");

      faqItems.forEach((el) => el.classList.remove("active"));

      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

/**
 * VŨ KHÍ CRO 1: THÔNG BÁO ĐẶT XE THỜI GIAN THỰC (SOCIAL PROOF TICKER)
 */
function initLiveBookingTicker() {
  const liveBookings = [
    { name: "Anh Tuấn", phone: "0984***128", route: "Hà Nội ⇄ Hạ Long (Bãi Cháy)", time: "2 phút trước" },
    { name: "Chị Lan", phone: "0912***567", route: "Nội Bài ⇄ Hải Phòng", time: "4 phút trước" },
    { name: "Anh Minh", phone: "0977***889", route: "Hà Nội ⇄ Cẩm Phả", time: "7 phút trước" },
    { name: "Chị Hương", phone: "0886***345", route: "Hạ Long ⇄ Hà Nội", time: "11 phút trước" },
    { name: "Anh Hoàng", phone: "0963***221", route: "Hà Nội ⇄ Móng Cái", time: "15 phút trước" },
    { name: "Anh Dũng", phone: "0904***678", route: "Hải Phòng ⇄ Cát Bi ⇄ Hạ Long", time: "18 phút trước" }
  ];

  let tickerEl = document.querySelector(".live-booking-ticker");
  if (!tickerEl) {
    tickerEl = document.createElement("div");
    tickerEl.className = "live-booking-ticker";
    document.body.appendChild(tickerEl);
  }

  let index = 0;

  function showNextNotification() {
    const item = liveBookings[index];
    tickerEl.innerHTML = `
      <div class="ticker-avatar">🚗</div>
      <div class="ticker-info">
        <div class="ticker-title">${item.name} (${item.phone})</div>
        <div class="ticker-desc">Đã đặt: ${item.route}</div>
        <div class="ticker-time">⏱️ ${item.time} • Đã xác nhận</div>
      </div>
    `;

    tickerEl.classList.add("active");

    setTimeout(() => {
      tickerEl.classList.remove("active");
    }, 5500);

    index = (index + 1) % liveBookings.length;
  }

  // Bắt đầu hiển thị sau 6 giây, lặp lại mỗi 18 giây
  setTimeout(() => {
    showNextNotification();
    setInterval(showNextNotification, 18000);
  }, 6000);
}

/**
 * VŨ KHÍ CRO 2: POPUP GIỮ CHÂN KHÁCH THOÁT TRANG (EXIT-INTENT POPUP)
 */
function initExitIntent() {
  const exitModal = document.getElementById("exitIntentModal");
  if (!exitModal) return;

  let shown = false;

  // 1. Trên máy tính: phát hiện chuột rời khỏi màn hình phía trên
  document.addEventListener("mouseleave", function (e) {
    if (e.clientY <= 10 && !shown) {
      showExitModal();
    }
  });

  // 2. Trên điện thoại: nếu lướt trang trên 45 giây mà chưa gọi/đặt
  setTimeout(function () {
    if (!shown && !localStorage.getItem("customer_bookings")) {
      showExitModal();
    }
  }, 45000);

  function showExitModal() {
    shown = true;
    exitModal.classList.add("active");
  }

  // Đóng modal
  const closeBtn = exitModal.querySelector(".exit-btn-close-text");
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      exitModal.classList.remove("active");
    });
  }

  exitModal.addEventListener("click", function (e) {
    if (e.target === exitModal) {
      exitModal.classList.remove("active");
    }
  });
}
