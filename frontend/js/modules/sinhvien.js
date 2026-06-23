/* ====================================
   MODULE SINH VIÊN
   File: js/modules/sinhvien.js
==================================== */

window.SinhVienModule = {
    state: {
        originalData: [],
        pendingOperations: {},
        history: []
    },
    allLops: [], // Danh sách toàn bộ lớp học từ API

    async init() {
        this.cacheDOM();
        this.bindEvents();
        await this.loadLopList();
        await this.loadSinhVien();
    },

    cacheDOM() {
        // Bộ lọc và Tìm kiếm
        this.searchSV = document.getElementById('searchSV');
        this.filterSVKhoaHoc = document.getElementById('filterSVKhoaHoc');
        this.filterSVLop = document.getElementById('filterSVLop');
        this.btnAdd = document.getElementById('btnAddSV');
        this.tbody = document.querySelector('#cardSV tbody');
        this.cardSV = document.getElementById('cardSV');

        this.btnCommit = document.getElementById('btnCommitSV');
        this.btnUndo = document.getElementById('btnUndoSV');
        this.pendingStatus = document.getElementById('svPendingStatus');

        // Modal & Form
        this.modal = document.getElementById('modalSV');
        this.form = document.getElementById('formSV');
        this.btnSave = document.getElementById('btnSaveSV');
        this.inputMa = document.getElementById('maSV');
        this.inputHo = document.getElementById('hoSV');
        this.inputTen = document.getElementById('tenSV');
        this.inputPhai = document.getElementById('phaiSV');
        this.selectLopModal = document.getElementById('lopSV');
    },

    bindEvents() {
        const user = Auth.getUser();
        const isPGV = user && user.role === 'PGV';

        if (this.btnAdd) {
            if (isPGV) {
                this.btnAdd.onclick = () => this.openModal();
            } else {
                this.btnAdd.style.display = 'none';
            }
        }

        document.getElementById('btnCloseModalSV').onclick = () => this.closeModal();
        document.getElementById('btnCancelModalSV').onclick = () => this.closeModal();
        this.btnSave.onclick = () => this.handleSave();

        if (this.btnCommit) this.btnCommit.onclick = () => this.handleCommit();
        if (this.btnUndo) this.btnUndo.onclick = () => this.handleUndo();

        // Lắng nghe sự kiện tìm kiếm & bộ lọc
        if (this.searchSV) {
            this.searchSV.addEventListener('input', () => this.filterAndRenderData());
        }
        if (this.filterSVKhoaHoc) {
            this.filterSVKhoaHoc.addEventListener('change', () => {
                this.updateClassFilterOptions(); // Khi đổi khóa học, cập nhật lại danh sách lớp khả dụng trong bộ lọc
                this.filterAndRenderData();
            });
        }
        if (this.filterSVLop) {
            this.filterSVLop.addEventListener('change', () => this.filterAndRenderData());
        }
    },

    async loadLopList() {
        try {
            const res = await API.get('/lop');
            if (res.success) {
                this.allLops = res.data || [];

                // 1. Điền danh sách Khóa học vào bộ lọc (Distinct KHOAHOC)
                if (this.filterSVKhoaHoc) {
                    this.filterSVKhoaHoc.innerHTML = '<option value="ALL">Tất cả Khóa học</option>';
                    const distinctKhoaHoc = [...new Set(this.allLops.map(lop => lop.KHOAHOC).filter(Boolean))].sort();
                    distinctKhoaHoc.forEach(kh => {
                        const opt = document.createElement('option');
                        opt.value = kh;
                        opt.textContent = kh;
                        this.filterSVKhoaHoc.appendChild(opt);
                    });
                }

                // 2. Điền tất cả các Lớp vào bộ lọc lúc đầu
                this.updateClassFilterOptions();

                // 3. Điền danh sách Lớp vào select trong Modal (dùng khi thêm/sửa)
                if (this.selectLopModal) {
                    this.selectLopModal.innerHTML = '<option value="">-- Chọn một lớp --</option>';
                    this.allLops.forEach(lop => {
                        this.selectLopModal.innerHTML += `<option value="${lop.MALOP}">${lop.MALOP} - ${lop.TENLOP}</option>`;
                    });
                }
            }
        } catch (error) {
            console.error('Không thể tải danh sách lớp', error);
        }
    },

    // Cập nhật danh sách Lớp học trong bộ lọc tùy theo Khóa học đang chọn
    updateClassFilterOptions() {
        if (!this.filterSVLop) return;
        const selectedCohort = this.filterSVKhoaHoc ? this.filterSVKhoaHoc.value : 'ALL';

        this.filterSVLop.innerHTML = '<option value="ALL">Tất cả Lớp</option>';

        const filteredLops = selectedCohort === 'ALL'
            ? this.allLops
            : this.allLops.filter(lop => lop.KHOAHOC === selectedCohort);

        filteredLops.forEach(lop => {
            const opt = document.createElement('option');
            opt.value = lop.MALOP;
            opt.textContent = `${lop.MALOP} - ${lop.TENLOP}`;
            this.filterSVLop.appendChild(opt);
        });
    },

    async loadSinhVien() {
        if (this.hasPendingChanges()) {
            const ok = confirm('Bạn đang có thay đổi chưa ghi. Tải lại dữ liệu sẽ bỏ các thay đổi này. Tiếp tục?');
            if (!ok) return;
        }

        try {
            this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Đang tải toàn bộ sinh viên...</td></tr>';
            const res = await API.get('/sinhvien');
            if (res.success) {
                this.state.originalData = res.data || [];
                this.state.pendingOperations = {};
                this.state.history = [];
                this.filterAndRenderData();
            }
        } catch (error) {
            this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Lỗi tải dữ liệu sinh viên</td></tr>';
            Toast.error(error.message);
        } finally {
            this.updateActionState();
        }
    },

    getCurrentData() {
        const map = new Map(
            this.state.originalData.map(item => [item.MASV, { ...item }])
        );

        Object.values(this.state.pendingOperations).forEach(op => {
            if (op.type === 'create' || op.type === 'update') {
                map.set(op.key, { ...op.newValue });
            } else if (op.type === 'delete') {
                map.delete(op.key);
            }
        });

        return Array.from(map.values()).sort((a, b) => a.MASV.localeCompare(b.MASV));
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
        if (this.btnCommit) {
            this.btnCommit.disabled = count === 0;
        }
        if (this.btnUndo) {
            this.btnUndo.disabled = this.state.history.length === 0;
        }
        if (this.pendingStatus) {
            this.pendingStatus.textContent = count > 0 ? `${count} thay đổi đang chờ ghi` : '';
        }
    },

    filterAndRenderData() {
        const keyword = this.searchSV ? this.searchSV.value.trim().toLowerCase() : '';
        const selectedCohort = this.filterSVKhoaHoc ? this.filterSVKhoaHoc.value : 'ALL';
        const selectedClass = this.filterSVLop ? this.filterSVLop.value : 'ALL';

        const currentData = this.getCurrentData();

        const filtered = currentData.filter(sv => {
            // 1. Tìm kiếm theo Mã SV hoặc Họ tên
            const fullName = `${sv.HO || ''} ${sv.TEN || ''}`.trim().toLowerCase();
            const matchesSearch = !keyword ||
                (sv.MASV && sv.MASV.toLowerCase().includes(keyword)) ||
                fullName.includes(keyword);

            // 2. Lọc theo Khóa học (KHOAHOC từ bảng LOP)
            let matchesCohort = true;
            if (selectedCohort !== 'ALL') {
                const studentClass = this.allLops.find(l => l.MALOP === sv.MALOP);
                matchesCohort = studentClass && studentClass.KHOAHOC === selectedCohort;
            }

            // 3. Lọc theo Lớp
            const matchesClass = selectedClass === 'ALL' || sv.MALOP === selectedClass;

            return matchesSearch && matchesCohort && matchesClass;
        });

        this.renderTable(filtered);
    },

    renderTable(data) {
        this.tbody.innerHTML = '';
        if (data.length === 0) {
            this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Không tìm thấy sinh viên nào phù hợp</td></tr>';
            return;
        }

        const user = Auth.getUser();
        const isPGV = user && user.role === 'PGV';

        data.forEach((sv, index) => {
            const tr = document.createElement('tr');
            
            const pendingOp = this.state.pendingOperations[sv.MASV];
            const statusBadge = this.getStatusBadge(pendingOp);

            const actionContent = isPGV
                ? `<button class="btn btn-primary btn-sm" onclick="window.SinhVienModule.openModal('${sv.MASV}', '${this.escapeJs(sv.HO || '')}', '${this.escapeJs(sv.TEN || '')}', ${sv.PHAI ? 1 : 0}, '${this.escapeJs(sv.MALOP)}')">Sửa</button>
           <button class="btn btn-danger btn-sm" onclick="window.SinhVienModule.handleDelete('${sv.MASV}')">Xoá</button>`
                : `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;

            tr.innerHTML = `
        <td>${index + 1}</td>
        <td style="font-weight: 600;">${sv.MASV}</td>
        <td>${sv.HO}</td>
        <td>${sv.TEN} ${statusBadge}</td>
        <td>${sv.MALOP}</td>
        <td>${sv.PHAI ? 'Nữ' : 'Nam'}</td>
        <td>
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            ${actionContent}
          </div>
        </td>
      `;
            this.tbody.appendChild(tr);
        });
    },

    openModal(ma = '', ho = '', ten = '', phai = 0, malop = '') {
        this.isEdit = !!ma;
        document.getElementById('modalTitleSV').textContent = this.isEdit ? 'Sửa Sinh Viên' : 'Thêm Sinh Viên';

        this.inputMa.value = ma;
        this.inputMa.readOnly = this.isEdit;
        this.inputHo.value = ho;
        this.inputTen.value = ten;
        this.inputPhai.value = phai;

        // Nếu có chọn một lớp cụ thể ở bộ lọc, tự động gán làm lớp mặc định trong modal
        if (this.selectLopModal) {
            if (malop) {
                this.selectLopModal.value = malop;
            } else {
                const filterLopVal = this.filterSVLop ? this.filterSVLop.value : 'ALL';
                this.selectLopModal.value = filterLopVal !== 'ALL' ? filterLopVal : '';
            }
        }

        this.modal.classList.add('active');
    },

    closeModal() {
        this.modal.classList.remove('active');
        this.form.reset();
    },

    async handleSave() {
        const ma = this.inputMa.value.trim();
        const ho = this.inputHo.value.trim();
        const ten = this.inputTen.value.trim();
        const phai = this.inputPhai.value;
        const maLop = this.selectLopModal ? this.selectLopModal.value : '';

        if (!ma || !ho || !ten || !maLop) {
            Toast.warning('Vui lòng điền đầy đủ thông tin sinh viên và chọn lớp');
            return;
        }

        const isFemale = phai === "1";
        const studentPayload = { MASV: ma, HO: ho, TEN: ten, PHAI: isFemale, MALOP: maLop };

        if (this.isEdit) {
            const originalItem = this.state.originalData.find(item => item.MASV === ma);
            const existingPending = this.state.pendingOperations[ma];

            if (existingPending && existingPending.type === 'delete') {
                Toast.warning('Sinh viên này đang chờ xoá, không thể sửa');
                return;
            }

            this.pushHistory();

            if (existingPending && existingPending.type === 'create') {
                this.state.pendingOperations[ma] = {
                    ...existingPending,
                    newValue: studentPayload
                };
            } else {
                this.state.pendingOperations[ma] = {
                    type: 'update',
                    key: ma,
                    oldValue: originalItem ? { ...originalItem } : null,
                    newValue: studentPayload
                };
            }

            // Nếu update xong mà lại giống hệt original thì xóa pending operation đi
            const pending = this.state.pendingOperations[ma];
            if (
                pending &&
                pending.type === 'update' &&
                pending.oldValue &&
                pending.oldValue.HO === ho &&
                pending.oldValue.TEN === ten &&
                !!pending.oldValue.PHAI === isFemale &&
                pending.oldValue.MALOP === maLop
            ) {
                delete this.state.pendingOperations[ma];
            }

            Toast.success('Đã đưa thay đổi vào danh sách chờ ghi');
        } else {
            const currentData = this.getCurrentData();
            const currentDataMap = new Map(currentData.map(item => [item.MASV, item]));
            if (currentDataMap.has(ma)) {
                Toast.warning('Mã sinh viên đã tồn tại trong danh sách');
                return;
            }

            this.pushHistory();
            this.state.pendingOperations[ma] = {
                type: 'create',
                key: ma,
                newValue: studentPayload
            };

            Toast.success('Đã thêm bản ghi vào danh sách chờ ghi');
        }

        this.closeModal();
        this.filterAndRenderData();
        this.updateActionState();
    },

    async handleDelete(ma) {
        if (!confirm(`Bạn có chắc chắn muốn xoá sinh viên ${ma}?`)) return;

        const existingPending = this.state.pendingOperations[ma];
        if (existingPending && existingPending.type === 'delete') {
            Toast.info('Sinh viên này đã nằm trong danh sách chờ xoá');
            return;
        }

        this.pushHistory();

        if (existingPending && existingPending.type === 'create') {
            delete this.state.pendingOperations[ma];
        } else {
            const originalItem = this.state.originalData.find(item => item.MASV === ma);
            if (!originalItem) {
                this.state.history.pop();
                Toast.error('Không tìm thấy sinh viên để xoá');
                return;
            }

            this.state.pendingOperations[ma] = {
                type: 'delete',
                key: ma,
                oldValue: { ...originalItem }
            };
        }

        this.filterAndRenderData();
        this.updateActionState();
        Toast.success('Đã đưa thao tác xoá vào danh sách chờ ghi');
    },

    handleUndo() {
        if (this.state.history.length === 0) {
            Toast.info('Không có thay đổi nào để phục hồi');
            return;
        }

        this.state.pendingOperations = this.state.history.pop();
        this.filterAndRenderData();
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
                    await API.post('/sinhvien/create', op.newValue);
                } else if (op.type === 'update') {
                    await API.put(`/sinhvien/update/${op.key}`, {
                        HO: op.newValue.HO,
                        TEN: op.newValue.TEN,
                        PHAI: op.newValue.PHAI,
                        MALOP: op.newValue.MALOP
                    });
                } else if (op.type === 'delete') {
                    await API.delete(`/sinhvien/delete/${op.key}`);
                }
            }

            Toast.success('Đã ghi tất cả thay đổi thành công');
            
            // Tải lại dữ liệu sau khi ghi thành công
            const res = await API.get('/sinhvien');
            if (res.success) {
                this.state.originalData = res.data || [];
            }
            this.state.pendingOperations = {};
            this.state.history = [];
            this.filterAndRenderData();
        } catch (error) {
            Toast.error(`Ghi dữ liệu thất bại: ${error.message}`);
        } finally {
            if (this.btnCommit) {
                this.btnCommit.textContent = 'Ghi';
            }
            this.updateActionState();
        }
    },

    escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    escapeJs(value) {
        return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }
};

window.SinhVienModule.init();
