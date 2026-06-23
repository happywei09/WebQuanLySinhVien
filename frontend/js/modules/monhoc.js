/* ====================================
   MODULE MON HOC (Ghi / Phục hồi)
   File: js/modules/monhoc.js
 ==================================== */

window.MonHocModule = {
  state: {
    originalData: [],
    pendingOperations: {},
    history: [],
    searchKeyword: '',
    isAddingRow: false,
    editingMHId: null,
    editingDraft: null,
    draftMH: {
      MAMH: '',
      TENMH: '',
      SOTIET_LT: '',
      SOTIET_TH: ''
    }
  },

  debounce(func, delay = 500) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(func, delay);
  },

  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadData();
  },

  cacheDOM() {
    this.tbody = document.querySelector('.monhoc-list-scroll table tbody');
    this.btnCommit = document.getElementById('btnCommitMH');
    this.btnUndo = document.getElementById('btnUndoMH');
    this.pendingStatus = document.getElementById('monhocPendingStatus');
    this.searchMH = document.getElementById('searchMH');
    this.btnSearchMH = document.getElementById('btnSearchMH');

    // Dynamically create the modal if it doesn't exist
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
                <input type="text" id="maMH" class="form-control" required placeholder="Ví dụ: INT1400">
              </div>
              <div class="form-group">
                <label class="form-label required">Tên Môn Học</label>
                <input type="text" id="tenMH" class="form-control" required placeholder="Ví dụ: Cơ sở dữ liệu">
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
            <button class="btn btn-primary" id="btnSaveMH">Lưu tạm</button>
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
    const btnAdd = document.getElementById('btnAddMH');

    if (btnAdd) {
      if (isPGV) {
        btnAdd.onclick = () => this.openModal();
      } else {
        btnAdd.style.display = 'none';
      }
    }

    if (!isPGV) {
      if (this.btnCommit) this.btnCommit.style.display = 'none';
      if (this.btnUndo) this.btnUndo.style.display = 'none';
    }

    document.getElementById('btnCloseModalMH').onclick = () => this.closeModal();
    document.getElementById('btnCancelModalMH').onclick = () => this.closeModal();
    this.btnSave.onclick = () => this.handleSaveDraftRow();
    
    if (this.btnCommit) this.btnCommit.onclick = () => this.handleCommit();
    if (this.btnUndo) this.btnUndo.onclick = () => this.handleUndo();

    if (this.btnSearchMH) {
      this.btnSearchMH.onclick = () => {
        const keyword = this.searchMH ? this.searchMH.value.trim() : '';
        this.loadData(keyword);
      };
    }

    if (this.searchMH) {
      this.searchMH.addEventListener('input', () => {
        this.debounce(() => {
          const keyword = this.searchMH.value.trim();
          this.loadData(keyword);
        });
      });
    }
  },

  async loadData(keyword = '') {
    if (this.hasPendingChanges() && keyword === this.state.searchKeyword) {
      this.renderTable();
      this.updateActionState();
      return;
    }

    try {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
      
      if (this.hasPendingChanges()) {
        const ok = confirm('Bạn đang có thay đổi chưa ghi. Tải lại dữ liệu sẽ bỏ các thay đổi này. Tiếp tục?');
        if (!ok) return;
      }

      this.state.searchKeyword = keyword;
      const endpoint = keyword ? `/monhoc/search?keyword=${encodeURIComponent(keyword)}` : '/monhoc';

      const res = await API.get(endpoint);
      if (res.success) {
        this.state.originalData = res.data || [];
        this.state.pendingOperations = {};
        this.state.history = [];
        this.renderTable();
      }
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Lỗi kết nối API.</td></tr>';
      Toast.error(error.message);
    } finally {
      this.updateActionState();
    }
  },

  renderTable() {
    const data = this.getCurrentData();
    this.tbody.innerHTML = '';

    if (data.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có dữ liệu</td></tr>';
      return;
    }

    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';

    data.forEach((item, index) => {
      const tr = document.createElement('tr');
      if (item._isDeleted) {
        tr.style.opacity = '0.6';
        tr.style.backgroundColor = 'rgba(220, 53, 69, 0.05)';
      }

      const pendingOp = this.state.pendingOperations[item.MAMH];
      const statusBadge = this.getStatusBadge(pendingOp);

      let actionContent = '';
      if (isPGV) {
        if (item._isDeleted) {
          actionContent = `<button class="btn btn-secondary btn-sm" onclick="window.MonHocModule.handleCancelDelete('${item.MAMH}')">Huỷ xoá</button>`;
        } else {
          const safeTen = (item.TENMH || '').replace(/'/g, "\\'");
          actionContent = `<button class="btn btn-info btn-sm" onclick="window.MonHocModule.openModal('${item.MAMH}', '${safeTen}', ${item.SOTIET_LT}, ${item.SOTIET_TH})">Sửa</button>
                           <button class="btn btn-danger btn-sm" onclick="window.MonHocModule.handleDelete('${item.MAMH}')">Xoá</button>`;
        }
      } else {
        actionContent = `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;
      }

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.MAMH}</td>
        <td>
          ${item.TENMH}
          ${statusBadge}
        </td>
        <td>${item.SOTIET_LT}</td>
        <td>${item.SOTIET_TH}</td>
        <td>
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            ${actionContent}
          </div>
        </td>
      `;
      this.tbody.appendChild(tr);
    });
  },

  getStatusBadge(pendingOp) {
    if (!pendingOp) return '';
    const labelMap = {
      create: 'Chờ thêm',
      update: 'Chờ cập nhật',
      delete: 'Chờ xoá'
    };
    return `
      <span style="display:inline-block; margin-left:8px; padding:2px 8px; border-radius:999px; background:rgba(147,33,32,0.12); color:var(--primary-color); font-size:12px; font-weight:600;">
        ${labelMap[pendingOp.type] || 'Chờ ghi'}
      </span>
    `;
  },

  getCurrentData() {
    const map = new Map(this.state.originalData.map(item => [item.MAMH, { ...item }]));

    Object.values(this.state.pendingOperations).forEach(op => {
      if (op.type === 'create' || op.type === 'update') {
        map.set(op.key, { ...op.newValue });
      } else if (op.type === 'delete') {
        const item = map.get(op.key);
        if (item) {
          item._isDeleted = true;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.MAMH.localeCompare(b.MAMH));
  },

  hasPendingChanges() {
    return Object.keys(this.state.pendingOperations).length > 0;
  },

  snapshotPendingOperations() {
    return JSON.parse(JSON.stringify(this.state.pendingOperations));
  },

  pushHistory() {
    this.state.history.push(this.snapshotPendingOperations());
  },

  updateActionState() {
    const count = Object.keys(this.state.pendingOperations).length;
    if (this.btnCommit) this.btnCommit.disabled = count === 0;
    if (this.btnUndo) this.btnUndo.disabled = this.state.history.length === 0;
    if (this.pendingStatus) {
      this.pendingStatus.textContent = count > 0 ? `${count} thay đổi đang chờ ghi` : '';
    }
  },

  openModal(ma = '', ten = '', lt = '', th = '') {
    this.isEdit = !!ma;
    this.state.editingMHId = ma || null;
    document.getElementById('modalTitleMH').textContent = this.isEdit ? 'Sửa Môn Học' : 'Thêm Môn Học';

    this.inputMa.value = ma;
    this.inputMa.readOnly = this.isEdit;
    this.inputTen.value = ten;
    this.inputLT.value = lt;
    this.inputTH.value = th;

    this.modal.classList.add('active');
    setTimeout(() => {
      if (this.isEdit) {
        this.inputTen.focus();
      } else {
        this.inputMa.focus();
      }
    }, 0);
  },

  closeModal() {
    this.modal.classList.remove('active');
    this.form.reset();
    this.state.editingMHId = null;
  },

  handleSaveDraftRow() {
    const ma = this.inputMa.value.trim();
    const ten = this.inputTen.value.trim();
    const lt = this.inputLT.value;
    const th = this.inputTH.value;

    if (!ma || !ten || lt === '' || th === '') {
      Toast.warning('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (Number(lt) === 0 && Number(th) === 0) {
      Toast.warning('Số tiết lý thuyết và thực hành không thể đồng thời bằng 0');
      return;
    }

    const currentData = this.getCurrentData();

    // Check duplicate name (excluding currently edited item)
    const isDuplicateName = currentData.some(item => item.MAMH !== ma && item.TENMH.toLowerCase() === ten.toLowerCase());
    if (isDuplicateName) {
      Toast.warning(`Tên môn học "${ten}" đã tồn tại trong danh sách!`);
      return;
    }

    this.pushHistory();

    if (this.isEdit) {
      const originalItem = this.state.originalData.find(item => item.MAMH === ma);
      const existingPending = this.state.pendingOperations[ma];

      if (existingPending && existingPending.type === 'create') {
        this.state.pendingOperations[ma] = {
          ...existingPending,
          newValue: { MAMH: ma, TENMH: ten, SOTIET_LT: Number(lt), SOTIET_TH: Number(th) }
        };
      } else {
        this.state.pendingOperations[ma] = {
          type: 'update',
          key: ma,
          oldValue: originalItem ? { ...originalItem } : { MAMH: ma, TENMH: '', SOTIET_LT: 0, SOTIET_TH: 0 },
          newValue: { MAMH: ma, TENMH: ten, SOTIET_LT: Number(lt), SOTIET_TH: Number(th) }
        };
      }

      // If change reverted to original, clean pending
      const pending = this.state.pendingOperations[ma];
      if (pending && pending.type === 'update' && pending.oldValue &&
          pending.oldValue.TENMH === ten &&
          Number(pending.oldValue.SOTIET_LT) === Number(lt) &&
          Number(pending.oldValue.SOTIET_TH) === Number(th)) {
        delete this.state.pendingOperations[ma];
      }
    } else {
      // Check duplicate ID
      const currentDataMap = new Map(currentData.map(item => [item.MAMH, item]));
      if (currentDataMap.has(ma)) {
        Toast.warning('Mã môn học đã tồn tại trong danh sách');
        this.state.history.pop();
        return;
      }

      this.state.pendingOperations[ma] = {
        type: 'create',
        key: ma,
        newValue: { MAMH: ma, TENMH: ten, SOTIET_LT: Number(lt), SOTIET_TH: Number(th) }
      };
    }

    this.closeModal();
    this.renderTable();
    this.updateActionState();
    Toast.success('Đã lưu tạm thay đổi');
  },

  handleDelete(ma) {
    if (!confirm(`Bạn có chắc chắn muốn xoá môn học ${ma}?`)) return;

    const existingPending = this.state.pendingOperations[ma];
    this.pushHistory();

    if (existingPending && existingPending.type === 'create') {
      delete this.state.pendingOperations[ma];
    } else {
      const originalItem = this.state.originalData.find(item => item.MAMH === ma);
      if (!originalItem) {
        Toast.error('Không tìm thấy môn học để xoá');
        this.state.history.pop();
        return;
      }

      this.state.pendingOperations[ma] = {
        type: 'delete',
        key: ma,
        oldValue: { ...originalItem }
      };
    }

    this.renderTable();
    this.updateActionState();
    Toast.success('Đã đưa thao tác xoá vào danh sách chờ ghi');
  },

  handleCancelDelete(ma) {
    this.pushHistory();
    delete this.state.pendingOperations[ma];
    this.renderTable();
    this.updateActionState();
    Toast.success('Đã huỷ thao tác xoá môn học');
  },

  handleUndo() {
    if (this.state.history.length === 0) {
      Toast.info('Không có thay đổi nào để phục hồi');
      return;
    }

    this.state.pendingOperations = this.state.history.pop();
    this.renderTable();
    this.updateActionState();
    Toast.success('Đã phục hồi thay đổi gần nhất');
  },

  async handleCommit() {
    const operations = Object.values(this.state.pendingOperations);
    if (operations.length === 0) {
      Toast.info('Không có thay đổi nào để ghi');
      return;
    }

    try {
      this.btnCommit.disabled = true;
      this.btnCommit.textContent = 'Đang ghi...';

      const sortedOperations = [
        ...operations.filter(op => op.type === 'create'),
        ...operations.filter(op => op.type === 'update'),
        ...operations.filter(op => op.type === 'delete')
      ];

      for (const op of sortedOperations) {
        if (op.type === 'create') {
          await API.post('/monhoc/create', op.newValue);
        } else if (op.type === 'update') {
          await API.put(`/monhoc/update/${op.key}`, {
            TENMH: op.newValue.TENMH,
            SOTIET_LT: op.newValue.SOTIET_LT,
            SOTIET_TH: op.newValue.SOTIET_TH
          });
        } else if (op.type === 'delete') {
          await API.delete(`/monhoc/delete/${op.key}`);
        }
      }

      Toast.success('Đã ghi tất cả thay đổi thành công');
      await this.reloadAfterCommit();
    } catch (error) {
      Toast.error(`Ghi dữ liệu thất bại: ${error.message}`);
    } finally {
      if (this.btnCommit) {
        this.btnCommit.textContent = 'Ghi';
      }
      this.updateActionState();
    }
  },

  async reloadAfterCommit() {
    const keyword = this.state.searchKeyword;
    const endpoint = keyword ? `/monhoc/search?keyword=${encodeURIComponent(keyword)}` : '/monhoc';
    const res = await API.get(endpoint);
    this.state.originalData = res.success ? (res.data || []) : [];
    this.state.pendingOperations = {};
    this.state.history = [];
    this.renderTable();
    this.updateActionState();
  }
};

window.MonHocModule.init();
