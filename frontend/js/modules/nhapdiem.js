/* ====================================
   MODULE NHẬP ĐIỂM
   File: js/modules/nhapdiem.js
   Quyền: PGV (toàn hệ thống) | KHOA (chỉ lớp thuộc khoa của mình)
==================================== */

window.NhapDiemModule = {
  state: {
    currentLTC: null,
    danhSachDiem: [],     // Dữ liệu gốc từ server
    editedDiem: {},       // Dữ liệu đã thay đổi (chưa lưu) { MASV: { DIEM_CC, DIEM_GK, DIEM_CK } }
    hasUnsavedChanges: false,
  },

  async init() {
    // Kiểm tra phân quyền: chỉ PGV và KHOA mới được vào
    const user = Auth.getUser();
    if (!user || (user.role !== 'PGV' && user.role !== 'KHOA')) {
      const pageContent = document.getElementById('pageContent');
      if (pageContent) {
        pageContent.innerHTML = `
          <div class="card">
            <div class="card-body" style="text-align:center; padding:60px; color:var(--danger-color);">
              <div style="font-size:48px; margin-bottom:16px;">🚫</div>
              <h3>Không có quyền truy cập</h3>
              <p style="color:var(--text-muted); margin-top:8px;">Chức năng Nhập Điểm chỉ dành cho Phòng Giáo Vụ (PGV) và Khoa.</p>
            </div>
          </div>`;
      }
      return;
    }

    this.cacheDOM();
    this.bindEvents();
    await this.loadLopTinChi();
  },

  cacheDOM() {
    this.selectLTC = document.getElementById('selectLopTinChi');
    this.btnLoad   = document.getElementById('btnLoadDanhSach');
    this.btnSave   = document.getElementById('btnSaveAllDiem');
    this.btnRefresh = document.getElementById('btnRefreshDiem');
    this.tbody     = document.getElementById('tbodyDiem');
    this.card      = document.getElementById('bangDiemCard');
    this.warning   = document.getElementById('unsavedWarning');
  },

  bindEvents() {
    this.btnLoad.addEventListener('click', () => this.loadDanhSachSinhVien());
    this.btnRefresh.addEventListener('click', () => this.loadDanhSachSinhVien());
    this.btnSave.addEventListener('click', () => this.saveAll());

    // Cảnh báo khi rời trang mà chưa lưu
    window.addEventListener('beforeunload', (e) => {
      if (this.state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    document.addEventListener('pageLoaded', (e) => {
      if (e.detail.pageId !== 'nhapdiem' && this.state.hasUnsavedChanges) {
        if (!confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?')) {
          // Cảnh báo đơn giản; routing đầy đủ cần xử lý thêm trong SPA phức tạp
        }
      }
    });
  },

  async loadLopTinChi() {
    try {
      const res = await API.get('/loptinchi');
      if (res.success && res.data) {
        this.selectLTC.innerHTML = '<option value="">-- Chọn một lớp tín chỉ --</option>';
        res.data.forEach(ltc => {
          // Chỉ hiển thị lớp chưa bị hủy
          if (!ltc.HUYLOP) {
            this.selectLTC.innerHTML += `<option value="${ltc.MALTC}">[${ltc.MALTC}] ${ltc.TENMH || ltc.MAMH} - Nhóm ${ltc.NHOM} (HK${ltc.HOCKY} ${ltc.NIENKHOA})</option>`;
          }
        });
      }
    } catch (error) {
      Toast.error('Không thể tải danh sách lớp tín chỉ: ' + error.message);
    }
  },

  async loadDanhSachSinhVien() {
    const maLTC = this.selectLTC.value;
    if (!maLTC) {
      Toast.warning('Vui lòng chọn lớp tín chỉ');
      return;
    }

    if (this.state.hasUnsavedChanges) {
      if (!confirm('Bạn có thay đổi chưa lưu. Làm mới sẽ mất dữ liệu chưa lưu. Tiếp tục?')) {
        return;
      }
    }

    try {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Đang tải...</td></tr>';
      this.card.style.display = 'block';

      const res = await API.get(`/diem/loptinchi/${maLTC}`);
      if (!res.success) throw new Error(res.message || 'Lỗi tải dữ liệu');

      this.state.currentLTC = maLTC;
      this.state.danhSachDiem = res.data || [];
      this.state.editedDiem = {};
      this.updateUnsavedState(false);
      this.renderTable();

    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Lỗi tải dữ liệu: ' + error.message + '</td></tr>';
      Toast.error(error.message);
    }
  },

  renderTable() {
    this.tbody.innerHTML = '';

    if (this.state.danhSachDiem.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Chưa có sinh viên đăng ký lớp này</td></tr>';
      return;
    }

    this.state.danhSachDiem.forEach((sv, index) => {
      // Lấy dữ liệu đã edit nếu có, nếu không dùng dữ liệu gốc
      const edited = this.state.editedDiem[sv.MASV] || {};
      const cc = edited.DIEM_CC !== undefined ? edited.DIEM_CC : (sv.DIEM_CC !== null ? sv.DIEM_CC : '');
      const gk = edited.DIEM_GK !== undefined ? edited.DIEM_GK : (sv.DIEM_GK !== null ? sv.DIEM_GK : '');
      const ck = edited.DIEM_CK !== undefined ? edited.DIEM_CK : (sv.DIEM_CK !== null ? sv.DIEM_CK : '');

      const diemTK = Utils.calcDiemTongKet(cc, gk, ck);

      // Tên hiển thị – hỗ trợ nhiều format field name từ DB
      const hoTen = sv.HOTEN || sv.HOTEN_SV || ((sv.HO || '') + ' ' + (sv.TEN || ''));

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${sv.MASV}</td>
        <td>${hoTen.trim()}</td>
        <td style="text-align: center;">
          <input type="number" step="1" min="0" max="10" class="inline-input" data-sv="${sv.MASV}" data-field="DIEM_CC" value="${cc}" placeholder="-">
        </td>
        <td style="text-align: center;">
          <input type="number" step="0.5" min="0" max="10" class="inline-input" data-sv="${sv.MASV}" data-field="DIEM_GK" value="${gk}" placeholder="-">
        </td>
        <td style="text-align: center;">
          <input type="number" step="0.5" min="0" max="10" class="inline-input" data-sv="${sv.MASV}" data-field="DIEM_CK" value="${ck}" placeholder="-">
        </td>
        <td style="text-align: center; font-weight: bold; color: var(--primary-color);" id="tk_${sv.MASV}">
          ${diemTK !== '' ? diemTK : '-'}
        </td>
      `;
      this.tbody.appendChild(tr);
    });

    // Lắng nghe sự kiện thay đổi điểm
    const inputs = this.tbody.querySelectorAll('.inline-input');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => this.handleDiemChange(e.target));
      input.addEventListener('input',  (e) => this.handleDiemChange(e.target));
    });
  },

  handleDiemChange(input) {
    const maSV  = input.dataset.sv;
    const field = input.dataset.field;
    let val = input.value.trim();

    // Validate 0-10
    if (val !== '') {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0 || num > 10) {
        input.classList.add('is-invalid');
        return;
      }
    }

    input.classList.remove('is-invalid');

    // Lưu vào edited state
    if (!this.state.editedDiem[maSV]) this.state.editedDiem[maSV] = {};
    this.state.editedDiem[maSV][field] = val === '' ? null : parseFloat(val);
    this.updateUnsavedState(true);

    // Tính lại điểm TK ngay lập tức
    const row = input.closest('tr');
    const cc = row.querySelector('[data-field="DIEM_CC"]').value;
    const gk = row.querySelector('[data-field="DIEM_GK"]').value;
    const ck = row.querySelector('[data-field="DIEM_CK"]').value;

    const diemTK = Utils.calcDiemTongKet(cc, gk, ck);
    document.getElementById(`tk_${maSV}`).textContent = diemTK !== '' ? diemTK : '-';
  },

  updateUnsavedState(isUnsaved) {
    this.state.hasUnsavedChanges = isUnsaved;
    if (isUnsaved) {
      this.warning.innerHTML = '⚠️ Có thay đổi chưa lưu';
      this.warning.style.color = 'var(--warning-color)';
    } else {
      this.warning.innerHTML = '';
    }
  },

  async saveAll() {
    if (!this.state.hasUnsavedChanges) {
      Toast.info('Không có thay đổi nào để lưu');
      return;
    }

    // Kiểm tra validation
    const invalidInputs = this.tbody.querySelectorAll('.is-invalid');
    if (invalidInputs.length > 0) {
      Toast.error('Vui lòng sửa các ô điểm không hợp lệ (0-10) trước khi lưu');
      return;
    }

    try {
      this.btnSave.disabled = true;
      this.btnSave.innerHTML = '⏳ Đang lưu...';

      // Chuyển format để gửi lên API
      const diemList = Object.keys(this.state.editedDiem).map(maSV => ({
        MASV: maSV,
        ...this.state.editedDiem[maSV],
      }));

      // Gọi API thật
      const res = await API.put('/diem/update-batch', {
        maLTC: this.state.currentLTC,
        diemList,
      });

      if (!res.success) throw new Error(res.message || 'Lỗi khi lưu');

      Toast.success('Đã lưu bảng điểm thành công');
      this.updateUnsavedState(false);

      // Merge dữ liệu đã sửa vào dữ liệu gốc để UI đồng bộ
      this.state.danhSachDiem = this.state.danhSachDiem.map(sv => {
        if (this.state.editedDiem[sv.MASV]) {
          return { ...sv, ...this.state.editedDiem[sv.MASV] };
        }
        return sv;
      });
      this.state.editedDiem = {};

    } catch (error) {
      Toast.error(error.message || 'Lỗi khi lưu bảng điểm');
    } finally {
      this.btnSave.disabled = false;
      this.btnSave.innerHTML = '💾 Lưu tất cả thay đổi';
    }
  },
};

// Khởi tạo module
window.NhapDiemModule.init();
