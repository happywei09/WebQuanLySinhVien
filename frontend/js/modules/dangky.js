/* ====================================
   MODULE ĐĂNG KÝ TÍN CHỈ
   File: js/modules/dangky.js
   Quyền:
     - SINHVIEN: Tìm lớp mở → Đăng ký / Hủy đăng ký lớp tín chỉ của mình
     - PGV: Xem danh sách, quản lý (chỉ xem trong trang này)
==================================== */

window.DangKyModule = {
  state: {
    danhSachLTC: [],        // Tất cả lớp tín chỉ đang mở
    danhSachDaDK: new Set(), // Set<MALTC> các lớp SV đã đăng ký
  },

  async init() {
    this.cacheDOM();
    this.setupUI();
    this.bindEvents();
  },

  cacheDOM() {
    this.tbody = document.getElementById('tbodyDangKy');
    this.btnTim = document.getElementById('btnTimLopMo');
    this.btnDangKy = document.getElementById('btnDangKy');
    this.inputNK = document.getElementById('dkNienKhoa');
    this.selectHK = document.getElementById('dkHocKy');
    this.statusMsg = document.getElementById('dkStatusMsg');
    this.cardSVInfo = document.getElementById('cardSVInfo');
    this.svName = document.getElementById('dkSVName');
    this.svMa = document.getElementById('dkSVMa');
    this.actionBar = document.getElementById('dkActionBar');
  },

  setupUI() {
    const user = Auth.getUser();
    if (!user) return;

    if (user.role === 'SINHVIEN') {
      // Hiển thị thông tin sinh viên
      this.cardSVInfo.style.display = 'block';
      this.svName.textContent = user.fullName || user.username;
      this.svMa.textContent = user.username;
      // Hiển thị action bar
      this.actionBar.style.display = 'flex';
      // Tải danh sách đã đăng ký của SV này
      this.loadDaDangKy(user.username);
    }
  },

  bindEvents() {
    this.btnTim.addEventListener('click', () => this.loadLopMo());
    if (this.btnDangKy) {
      this.btnDangKy.addEventListener('click', () => this.handleDangKy());
    }
  },

  // Lấy danh sách lớp SV này đã đăng ký (để hiển thị trạng thái)
  async loadDaDangKy(maSV) {
    try {
      const res = await API.get(`/dangky/sinhvien/${maSV}`);
      if (res.success && res.data) {
        this.state.danhSachDaDK = new Set(res.data.map(dk => dk.MALTC));
      }
    } catch (e) {
      // Bỏ qua lỗi – chỉ ảnh hưởng hiển thị trạng thái "đã đăng ký"
      console.warn('Không thể tải danh sách đã đăng ký:', e.message);
    }
  },

  // Tìm các lớp tín chỉ đang mở theo niên khóa + học kỳ
  async loadLopMo() {
    const nienKhoa = this.inputNK.value.trim();
    const hocKy = this.selectHK.value;

    if (!nienKhoa) {
      Toast.warning('Vui lòng nhập niên khóa (ví dụ: 2023-2024)');
      return;
    }

    try {
      this.tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Đang tải...</td></tr>';
      this.statusMsg.textContent = '';

      // Gọi API lọc theo niên khóa + học kỳ, chỉ lấy lớp chưa hủy
      const res = await API.get(`/loptinchi/filter?nienkhoa=${encodeURIComponent(nienKhoa)}&hocky=${hocKy}`);

      if (!res.success) throw new Error(res.message || 'Lỗi tải dữ liệu');

      const data = (res.data || []).filter(ltc => !ltc.HUYLOP);
      this.state.danhSachLTC = data;

      if (data.length === 0) {
        this.tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">Không có lớp tín chỉ nào mở trong ${nienKhoa} - HK${hocKy}</td></tr>`;
        return;
      }

      this.statusMsg.textContent = `Tìm thấy ${data.length} lớp`;
      this.renderTable(data);

    } catch (error) {
      this.tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Lỗi: ${error.message}</td></tr>`;
      Toast.error(error.message);
    }
  },

  renderTable(data) {
    const user = Auth.getUser();
    const isSV = user && user.role === 'SINHVIEN';

    this.tbody.innerHTML = '';
    data.forEach(item => {
      const daDK = this.state.danhSachDaDK.has(item.MALTC);
      const hoTenGV = item.TENGV || ((item.HO_GV || '') + ' ' + (item.TEN_GV || '')) || item.MAGV;

      // Cột checkbox – chỉ hiện cho SV, và chỉ check được nếu chưa đăng ký
      const checkboxCell = isSV
        ? `<td style="text-align:center;">
             ${daDK
          ? '<span title="Đã đăng ký">✅</span>'
          : `<input type="checkbox" class="dk-checkbox" value="${item.MALTC}" style="width:16px;height:16px;">`}
           </td>`
        : `<td style="text-align:center;">—</td>`;

      // Nút Hủy đăng ký (chỉ SV, chỉ khi đã đăng ký)
      const actionCell = isSV
        ? `<td style="text-align:center;">
             ${daDK
          ? `<button class="btn btn-danger btn-sm" onclick="window.DangKyModule.handleHuyDangKy(${item.MALTC})">Hủy ĐK</button>`
          : `<span style="color:var(--text-muted); font-size:12px;">Chưa đăng ký</span>`}
           </td>`
        : `<td style="text-align:center;"><span style="color:var(--text-muted); font-size:12px;">Chỉ xem</span></td>`;

      const tr = document.createElement('tr');
      if (daDK) tr.style.background = 'rgba(34,197,94,0.06)';

      tr.innerHTML = `
        ${checkboxCell}
        <td>${item.MALTC}</td>
        <td><strong>${item.TENMH || item.MAMH}</strong></td>
        <td style="text-align:center;">${item.NHOM}</td>
        <td>${hoTenGV.trim()}</td>
        <td style="text-align:center;">${item.SOSVDANGKY ?? item.SO_SV_DK ?? '—'}</td>
        <td style="text-align:center;">${item.SOSVTOITHIEU ?? item.SOSVMIN ?? '—'}</td>
        <td style="text-align:center;">
          ${daDK
          ? '<span style="color:#22c55e; font-weight:600;">Đã đăng ký ✓</span>'
          : '<span style="color:var(--text-muted);">Chưa</span>'}
        </td>
        ${actionCell}
      `;
      this.tbody.appendChild(tr);
    });
  },

  // Đăng ký các lớp được checkbox chọn
  async handleDangKy() {
    const user = Auth.getUser();
    if (!user || user.role !== 'SINHVIEN') {
      Toast.error('Chỉ sinh viên mới có thể đăng ký');
      return;
    }

    const checked = Array.from(document.querySelectorAll('.dk-checkbox:checked'));
    if (checked.length === 0) {
      Toast.warning('Vui lòng chọn ít nhất một lớp tín chỉ để đăng ký');
      return;
    }

    const maSV = user.username;
    let successCount = 0;
    let failCount = 0;

    this.btnDangKy.disabled = true;
    this.btnDangKy.innerHTML = '⏳ Đang đăng ký...';

    for (const cb of checked) {
      const maLTC = parseInt(cb.value);
      try {
        const res = await API.post('/dangky/create', { MALTC: maLTC, MASV: maSV });
        if (res.success) {
          successCount++;
          this.state.danhSachDaDK.add(maLTC);
        } else {
          failCount++;
          Toast.warning(`LTC ${maLTC}: ${res.message}`);
        }
      } catch (e) {
        failCount++;
        Toast.error(`LTC ${maLTC}: ${e.message}`);
      }
    }

    this.btnDangKy.disabled = false;
    this.btnDangKy.innerHTML = '✅ Đăng ký các lớp đã chọn';

    if (successCount > 0) {
      Toast.success(`Đăng ký thành công ${successCount} lớp tín chỉ`);
    }
    if (failCount > 0) {
      Toast.warning(`${failCount} lớp đăng ký thất bại`);
    }

    // Render lại bảng để cập nhật trạng thái
    this.renderTable(this.state.danhSachLTC);
  },

  // Hủy đăng ký một lớp
  async handleHuyDangKy(maLTC) {
    const user = Auth.getUser();
    if (!user || user.role !== 'SINHVIEN') return;

    if (!confirm(`Bạn có chắc chắn muốn hủy đăng ký lớp tín chỉ ${maLTC}?`)) return;

    try {
      const res = await API.put('/dangky/cancel', { MALTC: maLTC, MASV: user.username });
      if (res.success) {
        Toast.success('Đã hủy đăng ký thành công');
        this.state.danhSachDaDK.delete(maLTC);
        this.renderTable(this.state.danhSachLTC);
      } else {
        Toast.error(res.message || 'Hủy đăng ký thất bại');
      }
    } catch (e) {
      Toast.error(e.message);
    }
  },
};

window.DangKyModule.init();
