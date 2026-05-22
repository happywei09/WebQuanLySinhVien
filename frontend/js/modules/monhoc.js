window.MonHocModule = {
  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadData();
  },

  cacheDOM() {
    this.tbody = document.querySelector('#pageContent tbody');
    // We will dynamically create the modal if it doesn't exist
    if (!document.getElementById('modalMH')) {
      const modalHTML = `
      <div class="modal-overlay" id="modalMH">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitleMH">Thêm Môn Học</h3>
            <button class="btn-close" id="btnCloseModalMH">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formMH">
              <div class="form-group">
                <label class="form-label required">Mã Môn Học</label>
                <input type="text" id="maMH" class="form-control" required>
              </div>
              <div class="form-group">
                <label class="form-label required">Tên Môn Học</label>
                <input type="text" id="tenMH" class="form-control" required>
              </div>
              <div style="display: flex; gap: 16px;">
                <div class="form-group" style="flex: 1;">
                  <label class="form-label required">Số tiết LT</label>
                  <input type="number" id="ltMH" class="form-control" required min="0">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label required">Số tiết TH</label>
                  <input type="number" id="thMH" class="form-control" required min="0">
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelModalMH">Huỷ</button>
            <button class="btn btn-primary" id="btnSaveMH">Lưu</button>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    this.modal = document.getElementById('modalMH');
    this.form = document.getElementById('formMH');
    this.btnSave = document.getElementById('btnSaveMH');
    this.inputMa = document.getElementById('maMH');
    this.inputTen = document.getElementById('tenMH');
    this.inputLT = document.getElementById('ltMH');
    this.inputTH = document.getElementById('thMH');
  },

  bindEvents() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';
    const btnAdd = document.querySelector('.page-header .btn-primary');
    if (btnAdd) {
      if (isPGV) {
        btnAdd.onclick = () => this.openModal();
      } else {
        btnAdd.style.display = 'none';
      }
    }
    
    document.getElementById('btnCloseModalMH').onclick = () => this.closeModal();
    document.getElementById('btnCancelModalMH').onclick = () => this.closeModal();
    this.btnSave.onclick = () => this.handleSave();
  },

  async loadData() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';

    try {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
      const res = await API.get('/monhoc');
      if (res.success) {
        this.tbody.innerHTML = res.data.length === 0 
          ? '<tr><td colspan="6" style="text-align:center;">Không có dữ liệu</td></tr>'
          : res.data.map((item, index) => {
            const actionContent = isPGV
              ? `<button class="btn btn-secondary btn-sm" onclick="window.MonHocModule.openModal('${item.MAMH}', '${item.TENMH}', ${item.SOTIET_LT}, ${item.SOTIET_TH})">Sửa</button>
                 <button class="btn btn-danger btn-sm" onclick="window.MonHocModule.handleDelete('${item.MAMH}')">Xóa</button>`
              : `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;
            return `
            <tr>
              <td>${index + 1}</td>
              <td>${item.MAMH}</td>
              <td>${item.TENMH}</td>
              <td>${item.SOTIET_LT}</td>
              <td>${item.SOTIET_TH}</td>
              <td style="text-align:center;">
                ${actionContent}
              </td>
            </tr>`;
          }).join('');
      }
    } catch (error) { Toast.error(error.message); }
  },

  openModal(ma = '', ten = '', lt = '', th = '') {
    this.isEdit = !!ma;
    document.getElementById('modalTitleMH').textContent = this.isEdit ? 'Sửa Môn Học' : 'Thêm Môn Học';
    
    this.inputMa.value = ma;
    this.inputMa.readOnly = this.isEdit;
    this.inputTen.value = ten;
    this.inputLT.value = lt;
    this.inputTH.value = th;
    
    this.modal.classList.add('active');
  },

  closeModal() {
    this.modal.classList.remove('active');
    this.form.reset();
  },

  async handleSave() {
    const ma = this.inputMa.value.trim();
    const ten = this.inputTen.value.trim();
    const lt = this.inputLT.value;
    const th = this.inputTH.value;

    if (!ma || !ten || lt === '' || th === '') {
      Toast.warning('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      this.btnSave.disabled = true;
      let res;
      if (this.isEdit) {
        res = await API.put(`/monhoc/update/${ma}`, { TENMH: ten, SOTIET_LT: lt, SOTIET_TH: th });
      } else {
        res = await API.post('/monhoc/create', { MAMH: ma, TENMH: ten, SOTIET_LT: lt, SOTIET_TH: th });
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
    if (!confirm(`Bạn có chắc muốn xóa môn học ${ma}?`)) return;
    try {
      const res = await API.delete(`/monhoc/delete/${ma}`);
      if (res.success) {
        Toast.success(res.message);
        await this.loadData();
      }
    } catch (error) {
      Toast.error(error.message);
    }
  }
};
window.MonHocModule.init();
