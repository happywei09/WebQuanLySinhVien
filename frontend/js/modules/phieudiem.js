/* ====================================
   PHIẾU ĐIỂM CÁ NHÂN
   File: js/modules/phieudiem.js
   ==================================== */

document.addEventListener('pageLoaded', function (e) {
  if (e.detail.pageId !== 'phieudiem') return;

  // Biến lưu dữ liệu gốc
  var allGradesData = [];
  var domRefs = {};

  function cacheDOM() {
    domRefs.tbody = document.getElementById('tbodyPhieuDiem');
    domRefs.lblFullName = document.getElementById('pdFullName');
    domRefs.lblMaSV = document.getElementById('pdMaSV');
    domRefs.lblNgaySinh = document.getElementById('pdNgaySinh');
    domRefs.lblGioiTinh = document.getElementById('pdGioiTinh');
    domRefs.lblClass = document.getElementById('pdClass');
    domRefs.lblKhoa = document.getElementById('pdKhoa');
    domRefs.lblDiaChi = document.getElementById('pdDiaChi');
    domRefs.lblPrintDate = document.getElementById('pdPrintDate');
    domRefs.filterNienKhoa = document.getElementById('filterNienKhoa');
    domRefs.filterHocKy = document.getElementById('filterHocKy');
    domRefs.btnFilterGrades = document.getElementById('btnFilterGrades');
  }

  function setupEvents() {
    if (domRefs.btnFilterGrades) {
      domRefs.btnFilterGrades.addEventListener('click', applyFilters);
    }
  }

  async function loadData() {
    try {
      var user = Auth.getUser();
      if (!user || user.role !== 'SINHVIEN') {
        domRefs.tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Chức năng này chỉ dành cho Sinh Viên.</td></tr>';
        return;
      }

      domRefs.lblFullName.textContent = 'Đang tải...';
      domRefs.lblMaSV.textContent = user.username;

      // 1. Tải thông tin chi tiết Sinh viên
      var studentClass = '';
      try {
        var svRes = await API.get('/sinhvien/' + user.username);
        if (svRes.success && svRes.data) {
          var sv = svRes.data;
          domRefs.lblFullName.textContent = sv.HO + ' ' + sv.TEN;
          if (domRefs.lblNgaySinh) {
            domRefs.lblNgaySinh.textContent = sv.NGAYSINH ? new Date(sv.NGAYSINH).toLocaleDateString('vi-VN') : '-';
          }
          if (domRefs.lblGioiTinh) {
            domRefs.lblGioiTinh.textContent = sv.PHAI ? 'Nữ' : 'Nam';
          }
          if (domRefs.lblDiaChi) {
            domRefs.lblDiaChi.textContent = sv.DIACHI || '-';
          }
          studentClass = sv.MALOP;
          if (domRefs.lblClass) domRefs.lblClass.textContent = sv.MALOP;
        }
      } catch (err) {
        console.error('Lỗi tải chi tiết sinh viên:', err);
        domRefs.lblFullName.textContent = user.fullName || user.username;
      }

      // 2. Tải thông tin lớp học & khoa
      if (studentClass) {
        try {
          var lopRes = await API.get('/lop/' + studentClass);
          if (lopRes.success && lopRes.data) {
            var lop = lopRes.data;
            if (domRefs.lblClass) domRefs.lblClass.textContent = lop.MALOP + ' - ' + lop.TENLOP;
            if (domRefs.lblKhoa) domRefs.lblKhoa.textContent = lop.MAKHOA;
          }
        } catch (err) {
          console.error('Lỗi tải chi tiết lớp học:', err);
          if (domRefs.lblKhoa) domRefs.lblKhoa.textContent = '-';
        }
      } else {
        if (domRefs.lblKhoa) domRefs.lblKhoa.textContent = '-';
      }

      // 3. Thiết lập ngày lập phiếu
      if (domRefs.lblPrintDate) {
        var today = new Date();
        domRefs.lblPrintDate.textContent = 'Hà Nội, ngày ' + today.getDate() + ' tháng ' + (today.getMonth() + 1) + ' năm ' + today.getFullYear();
      }

      domRefs.tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Đang tải điểm...</td></tr>';

      // 4. Tải điểm từ API
      var res = await API.get('/diem/report/phieu-diem/' + user.username);
      if (res.success) {
        allGradesData = res.data || [];
        populateNienKhoaFilter();
        applyFilters();
      } else {
        throw new Error(res.message || 'Lỗi tải phiếu điểm');
      }
    } catch (error) {
      console.error('loadData() error:', error);
      domRefs.tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Lỗi: ' + error.message + '</td></tr>';
      if (typeof Toast !== 'undefined') Toast.error(error.message);
    }
  }

  function populateNienKhoaFilter() {
    if (!domRefs.filterNienKhoa) return;

    var uniqueYears = [];
    var seen = {};
    allGradesData.forEach(function (row) {
      if (row.NIENKHOA != null) {
        var y = row.NIENKHOA.trim();
        if (!seen[y]) {
          seen[y] = true;
          uniqueYears.push(y);
        }
      }
    });
    uniqueYears.sort(function (a, b) { return b.localeCompare(a); });

    domRefs.filterNienKhoa.innerHTML = '<option value="ALL">Tất cả niên khóa</option>';
    uniqueYears.forEach(function (year) {
      var option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      domRefs.filterNienKhoa.appendChild(option);
    });
  }

  function applyFilters() {
    var nienKhoaOpt = domRefs.filterNienKhoa ? domRefs.filterNienKhoa.value : 'ALL';
    var hocKyOpt = domRefs.filterHocKy ? domRefs.filterHocKy.value : 'ALL';

    var filteredData = allGradesData.filter(function (row) {
      var rowYear = row.NIENKHOA ? row.NIENKHOA.trim() : '';
      var matchYear = nienKhoaOpt === 'ALL' || rowYear === nienKhoaOpt;
      var matchSemester = hocKyOpt === 'ALL' || String(row.HOCKY) === hocKyOpt;
      return matchYear && matchSemester;
    });

    renderTable(filteredData);
  }

  function renderTable(data) {
    domRefs.tbody.innerHTML = '';
    if (!data || data.length === 0) {
      domRefs.tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chưa có điểm môn học nào được ghi nhận khớp với bộ lọc.</td></tr>';
      return;
    }

    data.forEach(function (row) {
      var tenMH = row.TENMH || 'Không xác định';
      var cc = (row.DIEM_CC !== null && row.DIEM_CC !== undefined) ? row.DIEM_CC : '-';
      var gk = (row.DIEM_GK !== null && row.DIEM_GK !== undefined) ? row.DIEM_GK : '-';
      var ck = (row.DIEM_CK !== null && row.DIEM_CK !== undefined) ? row.DIEM_CK : '-';
      var diem = (row.DIEM !== null && row.DIEM !== undefined) ? row.DIEM : '-';

      var tr = document.createElement('tr');
      if (row.DIEM === null || row.DIEM === undefined) {
        tr.classList.add('no-grade-row');
      }

      tr.innerHTML =
        '<td class="row-num" style="text-align: center;"></td>' +
        '<td><strong>' + tenMH + '</strong></td>' +
        '<td style="text-align: center;">' + cc + '</td>' +
        '<td style="text-align: center;">' + gk + '</td>' +
        '<td style="text-align: center;">' + ck + '</td>' +
        '<td style="text-align: center; font-weight: bold; color: var(--primary-color);">' + diem + '</td>';

      domRefs.tbody.appendChild(tr);
    });
  }

  // === KHỞI TẠO ===
  cacheDOM();
  if (!domRefs.tbody) {
    console.warn('phieudiem.js: DOM chưa sẵn sàng.');
    return;
  }
  setupEvents();
  loadData();
});
