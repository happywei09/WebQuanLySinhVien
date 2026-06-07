/* ====================================
   MODULE KHOA (CRUD Template)
   File: js/modules/khoa.js
==================================== */

window.KhoaModule = {
  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadData();
  },

  cacheDOM() {
    this.tbody = document.getElementById('tbodyKhoa');
    this.modal = document.getElementById('modalKhoa');
    this.form = document.getElementById('formKhoa');
    this.btnSave = document.getElementById('btnSaveKhoa');
    this.btnSearch = document.getElementById('btnSearchKhoa');
    this.searchInput = document.getElementById('searchKhoa');
    
    // Inputs
    this.inputMa = document.getElementById('maKhoa');
    this.inputTen = document.getElementById('tenKhoa');
  },

  bindEvents() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';
    const btnAdd = document.getElementById('btnAddKhoa');
    if (btnAdd) {
      if (isPGV) {
        btnAdd.onclick = () => this.openModal();
      } else {
        btnAdd.style.display = 'none';
      }
    }
    document.getElementById('btnCloseModal').onclick = () => this.closeModal();
    document.getElementById('btnCancelModal').onclick = () => this.closeModal();
    this.btnSave.onclick = () => this.handleSave();
    this.btnSearch.onclick = () => this.loadData();
  },

  async loadData() {
    try {
      this.tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Đang tải...</td></tr>';
      
      const keyword = this.searchInput.value;
      const endpoint = keyword ? `/khoa/search?keyword=${keyword}` : '/khoa';
      
      const response = await API.get(endpoint);
      
      if (response.success) {
        this.renderTable(response.data);
      }
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Lỗi kết nối API. Hãy kiểm tra Backend.</td></tr>';
      Toast.error(error.message);
    }
  },

  renderTable(data) {
    this.tbody.innerHTML = '';
    if (data.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Không có dữ liệu</td></tr>';
      return;
    }

    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';

    data.forEach((item, index) => {
      const tr = document.createElement('tr');
      const actionContent = isPGV 
        ? `<button class="btn btn-secondary btn-sm" onclick="KhoaModule.openModal('${Utils.escapeHtml(item.MAKHOA)}', '${Utils.escapeHtml(item.TENKHOA)}')">Sửa</button>
           <button class="btn btn-danger btn-sm" onclick="KhoaModule.handleDelete('${Utils.escapeHtml(item.MAKHOA)}')">Xoá</button>`
        : `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${Utils.escapeHtml(item.MAKHOA)}</td>
        <td>${Utils.escapeHtml(item.TENKHOA)}</td>
        <td style="text-align: center;">
          ${actionContent}
        </td>
      `;
      this.tbody.appendChild(tr);
    });
  },

  openModal(ma = '', ten = '') {
    this.isEdit = !!ma;
    document.getElementById('modalTitle').textContent = this.isEdit ? 'Sửa Khoa' : 'Thêm Khoa';
    this.inputMa.value = ma;
    this.inputMa.readOnly = this.isEdit;
    this.inputTen.value = ten;
    this.modal.classList.add('active');
  },

  closeModal() {
    this.modal.classList.remove('active');
    this.form.reset();
  },

  async handleSave() {
    const ma = this.inputMa.value.trim();
    const ten = this.inputTen.value.trim();

    if (!ma || !ten) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      this.btnSave.disabled = true;
      let res;
      
      if (this.isEdit) {
        res = await API.put(`/khoa/update/${ma}`, { TENKHOA: ten });
      } else {
        res = await API.post('/khoa/create', { MAKHOA: ma, TENKHOA: ten });
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
    if (!confirm(`Bạn có chắc chắn muốn xoá khoa ${ma}?`)) return;

    try {
      const res = await API.delete(`/khoa/delete/${ma}`);
      if (res.success) {
        Toast.success(res.message);
        await this.loadData();
      }
    } catch (error) {
      Toast.error(error.message);
    }
  }
};

// Expose to global for onclick events

window.KhoaModule.init();
