window.LopModule = {
  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadKhoaList();
    await this.loadData();
  },

  cacheDOM() {
    this.tbody = document.querySelector('#pageContent tbody');

    if (!document.getElementById('modalLop')) {
      const modalHTML = `
      <div class="modal-overlay" id="modalLop">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitleLop">Thêm Lớp</h3>
            <button class="btn-close" id="btnCloseModalLop">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formLop">
              <div class="form-group">
                <label class="form-label required">Mã Lớp</label>
                <input type="text" id="maLop" class="form-control" required>
              </div>
              <div class="form-group">
                <label class="form-label required">Tên Lớp</label>
                <input type="text" id="tenLop" class="form-control" required>
              </div>
              <div class="form-group">
                <label class="form-label required">Khóa học</label>
                <input type="text" id="khoaHocLop" class="form-control" required>
              </div>
              <div class="form-group">
                <label class="form-label required">Khoa trực thuộc</label>
                <select id="khoaLop" class="form-control" required></select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelModalLop">Huỷ</button>
            <button class="btn btn-primary" id="btnSaveLop">Lưu</button>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    this.modal = document.getElementById('modalLop');
    this.form = document.getElementById('formLop');
    this.btnSave = document.getElementById('btnSaveLop');
    this.inputMa = document.getElementById('maLop');
    this.inputTen = document.getElementById('tenLop');
    this.inputKhoaHoc = document.getElementById('khoaHocLop');
    this.selectKhoa = document.getElementById('khoaLop');
  },

  bindEvents() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';
    const btnAdd = document.getElementById('btnAddLop');
    if (btnAdd) {
      if (isPGV) {
        btnAdd.onclick = () => this.openModal();
      } else {
        btnAdd.style.display = 'none';
      }
    }

    document.getElementById('btnCloseModalLop').onclick = () => this.closeModal();
    document.getElementById('btnCancelModalLop').onclick = () => this.closeModal();
    this.btnSave.onclick = () => this.handleSave();
  },

  async loadKhoaList() {
    try {
      const res = await API.get('/khoa');
      if (res.success) {
        this.selectKhoa.innerHTML = '<option value="">-- Chọn Khoa --</option>' +
          res.data.map(k => `<option value="${Utils.escapeHtml(k.MAKHOA)}">${Utils.escapeHtml(k.MAKHOA)} - ${Utils.escapeHtml(k.TENKHOA)}</option>`).join('');
      }
    } catch (e) { }
  },

  async loadData() {
    try {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
      const res = await API.get('/lop');
      if (res.success) {
        const user = Auth.getUser();
        const isPGV = user && user.role === 'PGV';

        this.tbody.innerHTML = res.data.length === 0
          ? '<tr><td colspan="6" style="text-align:center;">Không có dữ liệu</td></tr>'
          : res.data.map((item, index) => {
            const actionBtn = isPGV
              ? `<button class="btn btn-secondary btn-sm" onclick="window.LopModule.openModal('${Utils.escapeHtml(item.MALOP)}', '${Utils.escapeHtml(item.TENLOP)}', '${Utils.escapeHtml(item.KHOAHOC)}', '${Utils.escapeHtml(item.MAKHOA)}')">Sửa</button>
                 <button class="btn btn-danger btn-sm" onclick="window.LopModule.handleDelete('${Utils.escapeHtml(item.MALOP)}')">Xóa</button>`
              : `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;
            return `
            <tr>
              <td>${index + 1}</td>
              <td>${Utils.escapeHtml(item.MALOP)}</td>
              <td>${Utils.escapeHtml(item.TENLOP)}</td>
              <td>${Utils.escapeHtml(item.KHOAHOC)}</td>
              <td>${Utils.escapeHtml(item.MAKHOA)}</td>
              <td>${actionBtn}</td>
            </tr>`;
          }).join('');
      }
    } catch (error) { Toast.error(error.message); }
  },

  openModal(ma = '', ten = '', khoaHoc = '', khoa = '') {
    this.isEdit = !!ma;
    document.getElementById('modalTitleLop').textContent = this.isEdit ? 'Sửa Lớp' : 'Thêm Lớp';

    this.inputMa.value = ma;
    this.inputMa.readOnly = this.isEdit;
    this.inputTen.value = ten;
    this.inputKhoaHoc.value = khoaHoc;
    this.selectKhoa.value = khoa;

    this.modal.classList.add('active');
  },

  closeModal() {
    this.modal.classList.remove('active');
    this.form.reset();
  },

  async handleSave() {
    const ma = this.inputMa.value.trim();
    const ten = this.inputTen.value.trim();
    const khoaHoc = this.inputKhoaHoc.value.trim();
    const khoa = this.selectKhoa.value;

    if (!ma || !ten || !khoaHoc || !khoa) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      this.btnSave.disabled = true;
      const data = { MALOP: ma, TENLOP: ten, KHOAHOC: khoaHoc, MAKHOA: khoa };
      let res;
      if (this.isEdit) {
        res = await API.put(`/lop/update/${ma}`, data);
      } else {
        res = await API.post('/lop/create', data);
      }

      if (res.success) {
        Toast.success(res.message);
        this.closeModal();
        await this.loadData();
      }
    } catch (error) {
      Toast.error(error.message);
    } finally {
      this.btnSave.disabled = false;
    }
  },

  async handleDelete(ma) {
    if (!confirm(`Bạn có chắc muốn xóa lớp ${ma}?`)) return;
    try {
      const res = await API.delete(`/lop/delete/${ma}`);
      if (res.success) {
        Toast.success(res.message);
        await this.loadData();
      }
    } catch (error) {
      Toast.error(error.message);
    }
  }
};
window.LopModule.init();
