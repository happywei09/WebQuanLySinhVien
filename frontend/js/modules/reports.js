/* ====================================
   MODULE REPORTS & EXPORT
   File: js/modules/reports.js
==================================== */

window.ReportsModule = {
  state: {
    reportType: null,
    nienKhoaList: [],
    lopTinChiList: [],
    lopList: [],
    activeData: []
  },

  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadInitialFilters();
  },

  cacheDOM() {
    this.typeSelect = document.getElementById('reportTypeSelect');
    this.btnGenerate = document.getElementById('btnGenerateReport');
    this.btnPrint = document.getElementById('btnPrintReport');
    this.btnExport = document.getElementById('btnExportExcel');
    
    // Filter groups
    this.groupNKHK = document.getElementById('groupNienKhoaHocKy');
    this.groupHK = document.getElementById('groupHocKy');
    this.groupLTC = document.getElementById('groupLopTinChi');
    this.groupSV = document.getElementById('groupSinhVien');
    this.groupLop = document.getElementById('groupLop');
    
    // Filter elements
    this.selectNienKhoa = document.getElementById('reportNienKhoa');
    this.selectHocKy = document.getElementById('reportHocKy');
    this.selectLTC = document.getElementById('reportLTC');
    this.inputMaSV = document.getElementById('reportMaSV');
    this.selectLop = document.getElementById('reportMaLop');
    
    // Output cards
    this.actionsCard = document.getElementById('reportActionsCard');
    this.displayCard = document.getElementById('reportDisplayCard');
    this.reportHeader = document.getElementById('reportHeader');
    this.tbody = document.getElementById('reportTableBody');
    this.thead = document.getElementById('reportTableHead');
    this.reportFooter = document.getElementById('reportFooter');
  },

  bindEvents() {
    // Show/hide filters dynamically
    this.typeSelect.addEventListener('change', (e) => this.handleReportTypeChange(e.target.value));
    
    // Listeners for credit class filtering
    this.selectNienKhoa.addEventListener('change', () => this.loadLopTinChiOptions());
    this.selectHocKy.addEventListener('change', () => this.loadLopTinChiOptions());
    
    // Actions
    this.btnGenerate.addEventListener('click', () => this.generateReport());
    this.btnPrint.addEventListener('click', () => window.print());
    this.btnExport.addEventListener('click', () => this.exportToExcel());
  },

  async loadInitialFilters() {
    try {
      // 1. Tải danh sách bộ lọc Niên khoá & Học kỳ từ Dashboard Filters
      const filterRes = await API.get('/dashboard/filters');
      if (filterRes.success && filterRes.data) {
        const semesters = filterRes.data.semesters || [];
        this.state.nienKhoaList = [...new Set(semesters.map(s => s.NIENKHOA))].sort();
        
        this.selectNienKhoa.innerHTML = '<option value="">-- Chọn Niên khóa --</option>';
        this.state.nienKhoaList.forEach(nk => {
          this.selectNienKhoa.innerHTML += `<option value="${nk}">${nk}</option>`;
        });
      }

      // 2. Tải danh sách Lớp học phục vụ Báo cáo Tổng kết
      const lopRes = await API.get('/lop');
      if (lopRes.success) {
        this.state.lopList = lopRes.data || [];
        this.selectLop.innerHTML = '<option value="">-- Chọn lớp --</option>';
        this.state.lopList.forEach(lop => {
          this.selectLop.innerHTML += `<option value="${lop.MALOP}">${lop.MALOP} - ${lop.TENLOP}</option>`;
        });
      }
    } catch (error) {
      console.error('Không thể tải dữ liệu bộ lọc ban đầu:', error);
      Toast.error('Lỗi khi tải bộ lọc');
    }
  },

  async loadLopTinChiOptions() {
    const nienKhoa = this.selectNienKhoa.value;
    const hocKy = this.selectHocKy.value;
    
    if (!nienKhoa || !hocKy) return;

    try {
      this.selectLTC.innerHTML = '<option value="">Đang tải lớp tín chỉ...</option>';
      const res = await API.get(`/loptinchi/filter?nienKhoa=${encodeURIComponent(nienKhoa)}&hocKy=${hocKy}`);
      
      if (res.success) {
        this.state.lopTinChiList = res.data || [];
        this.selectLTC.innerHTML = '<option value="">-- Chọn lớp tín chỉ --</option>';
        this.state.lopTinChiList.forEach(ltc => {
          this.selectLTC.innerHTML += `<option value="${ltc.MALTC}">[Mã LTC: ${ltc.MALTC}] Nhóm ${ltc.NHOM} - Môn ${ltc.MAMH}</option>`;
        });
      }
    } catch (error) {
      this.selectLTC.innerHTML = '<option value="">Lỗi tải lớp tín chỉ</option>';
      console.error(error);
    }
  },

  handleReportTypeChange(type) {
    this.state.reportType = type;
    
    // Hide all filters
    const filters = [this.groupNKHK, this.groupHK, this.groupLTC, this.groupSV, this.groupLop];
    filters.forEach(f => f.style.display = 'none');
    
    // Hide report views
    this.actionsCard.style.display = 'none';
    this.displayCard.style.display = 'none';

    if (!type) return;

    // Show filters depending on selected report
    switch (type) {
      case 'ds_ltc':
        this.groupNKHK.style.display = 'block';
        this.groupHK.style.display = 'block';
        break;
      case 'dssv_ltc':
      case 'bang_diem_mh':
        this.groupNKHK.style.display = 'block';
        this.groupHK.style.display = 'block';
        this.groupLopTinChi.style.display = 'block';
        this.loadLopTinChiOptions();
        break;
      case 'phieu_diem':
        this.groupSV.style.display = 'block';
        break;
      case 'bang_diem_tk':
        this.groupLop.style.display = 'block';
        break;
    }
  },

  async generateReport() {
    const type = this.state.reportType;
    if (!type) {
      Toast.warning('Vui lòng chọn loại báo cáo');
      return;
    }

    try {
      this.tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Đang tạo báo cáo...</td></tr>';
      this.thead.innerHTML = '';
      this.reportFooter.innerHTML = '';
      this.actionsCard.style.display = 'none';
      this.displayCard.style.display = 'block';

      let endpoint = '';
      let title = '';
      let subtitle = '';

      const user = Auth.getUser();
      const serverName = user ? (user.serverName || 'Chi nhánh hiện tại') : '';

      switch (type) {
        case 'ds_ltc':
          const nk = this.selectNienKhoa.value;
          const hk = this.selectHocKy.value;
          if (!nk || !hk) {
            Toast.warning('Vui lòng chọn niên khóa và học kỳ');
            return;
          }
          endpoint = `/diem/report/ds-lop-tin-chi?nienKhoa=${encodeURIComponent(nk)}&hocKy=${hk}`;
          title = `DANH SÁCH LỚP TÍN CHỈ ĐÃ MỞ (CHƯA HỦY)`;
          subtitle = `${serverName.toUpperCase()}<br/>Niên khóa: ${nk} - Học kỳ: ${hk}`;
          break;

        case 'dssv_ltc':
          const ltcVal = this.selectLTC.value;
          if (!ltcVal) {
            Toast.warning('Vui lòng chọn lớp tín chỉ');
            return;
          }
          const selectedLtc1 = this.state.lopTinChiList.find(x => x.MALTC == ltcVal);
          endpoint = `/diem/report/dssv-dang-ky/${ltcVal}`;
          title = `DANH SÁCH SINH VIÊN ĐĂNG KÝ LỚP TÍN CHỈ`;
          subtitle = `${serverName.toUpperCase()}<br/>Lớp tín chỉ: ${ltcVal} ${selectedLtc1 ? ` - Môn học: ${selectedLtc1.MAMH} - Nhóm: ${selectedLtc1.NHOM}` : ''}`;
          break;

        case 'bang_diem_mh':
          const ltcDiemVal = this.selectLTC.value;
          if (!ltcDiemVal) {
            Toast.warning('Vui lòng chọn lớp tín chỉ');
            return;
          }
          const selectedLtc2 = this.state.lopTinChiList.find(x => x.MALTC == ltcDiemVal);
          endpoint = `/diem/report/bang-diem-mon-hoc/${ltcDiemVal}`;
          title = `BẢNG ĐIỂM HẾT MÔN`;
          subtitle = `${serverName.toUpperCase()}<br/>Lớp tín chỉ: ${ltcDiemVal} ${selectedLtc2 ? ` - Môn học: ${selectedLtc2.MAMH} - Nhóm: ${selectedLtc2.NHOM}` : ''}`;
          break;

        case 'phieu_diem':
          const masv = this.inputMaSV.value.trim();
          if (!masv) {
            Toast.warning('Vui lòng nhập mã sinh viên');
            return;
          }
          endpoint = `/diem/report/phieu-diem/${masv}`;
          title = `PHIẾU ĐIỂM CÁ NHÂN`;
          subtitle = `Sinh viên: ${masv}`;
          break;

        case 'bang_diem_tk':
          const lopVal = this.selectLop.value;
          if (!lopVal) {
            Toast.warning('Vui lòng chọn lớp học');
            return;
          }
          endpoint = `/diem/report/bang-diem-tong-ket/${lopVal}`;
          title = `BẢNG ĐIỂM TỔNG KẾT CUỐI KHÓA`;
          subtitle = `LỚP: ${lopVal} - KHOA: ${serverName.toUpperCase()}`;
          break;
      }

      const res = await API.get(endpoint);
      if (res.success) {
        this.state.activeData = res.data || [];
        this.actionsCard.style.display = 'flex';
        
        // Render headers
        this.reportHeader.innerHTML = `
          <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">${title}</h2>
          <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6;">${subtitle}</p>
        `;

        this.renderReportTable(type);
      } else {
        throw new Error(res.message || 'Lỗi tải báo cáo');
      }

    } catch (error) {
      this.tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red;">Lỗi: ${error.message}</td></tr>`;
      Toast.error(error.message);
    }
  },

  renderReportTable(type) {
    const data = this.state.activeData;
    this.tbody.innerHTML = '';
    
    if (data.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 24px;">Không có dữ liệu báo cáo</td></tr>';
      return;
    }

    if (type === 'ds_ltc') {
      this.thead.innerHTML = `
        <tr>
          <th width="60">STT</th>
          <th>Tên môn học</th>
          <th width="80" style="text-align: center;">Nhóm</th>
          <th>Họ tên GV giảng</th>
          <th width="120" style="text-align: center;">Sĩ số tối thiểu</th>
          <th width="120" style="text-align: center;">Đã đăng ký</th>
        </tr>
      `;
      data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td style="font-weight: 600;">${row.TENMH || ''}</td>
          <td style="text-align: center;">${row.NHOM || 0}</td>
          <td>${row.HOTEN_GV || ''}</td>
          <td style="text-align: center;">${row.SOSVTOITHIEU || 0}</td>
          <td style="text-align: center; font-weight: bold; color: var(--primary-color);">${row.SOSV_DANGKY || 0}</td>
        `;
        this.tbody.appendChild(tr);
      });
      this.reportFooter.innerHTML = `Số lượng lớp đã mở: ${data.length}`;

    } else if (type === 'dssv_ltc') {
      this.thead.innerHTML = `
        <tr>
          <th width="60">STT</th>
          <th width="150">Mã SV</th>
          <th>Họ</th>
          <th>Tên</th>
          <th width="100" style="text-align: center;">Phái</th>
          <th width="150">Mã lớp</th>
        </tr>
      `;
      data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td style="font-weight: 600;">${row.MASV || ''}</td>
          <td>${row.HO || ''}</td>
          <td>${row.TEN || ''}</td>
          <td style="text-align: center;">${row.PHAI ? 'Nữ' : 'Nam'}</td>
          <td>${row.MALOP || ''}</td>
        `;
        this.tbody.appendChild(tr);
      });
      this.reportFooter.innerHTML = `Số sinh viên đã đăng ký: ${data.length}`;

    } else if (type === 'bang_diem_mh') {
      this.thead.innerHTML = `
        <tr>
          <th width="60">STT</th>
          <th width="150">Mã SV</th>
          <th>Họ</th>
          <th>Tên</th>
          <th width="100" style="text-align: center;">Điểm CC</th>
          <th width="100" style="text-align: center;">Điểm GK</th>
          <th width="100" style="text-align: center;">Điểm CK</th>
          <th width="120" style="text-align: center; font-weight: bold; color: var(--primary-color);">Điểm Hết Môn</th>
        </tr>
      `;
      data.forEach((row, index) => {
        const tr = document.createElement('tr');
        const cc = row.DIEM_CC !== null ? row.DIEM_CC : '-';
        const gk = row.DIEM_GK !== null ? row.DIEM_GK : '-';
        const ck = row.DIEM_CK !== null ? row.DIEM_CK : '-';
        const kthp = row.DIEM_KTHP !== null ? (Math.round(row.DIEM_KTHP * 100) / 100) : '-';

        tr.innerHTML = `
          <td>${index + 1}</td>
          <td style="font-weight: 600;">${row.MASV || ''}</td>
          <td>${row.HO || ''}</td>
          <td>${row.TEN || ''}</td>
          <td style="text-align: center;">${cc}</td>
          <td style="text-align: center;">${gk}</td>
          <td style="text-align: center;">${ck}</td>
          <td style="text-align: center; font-weight: 700; color: var(--primary-color);">${kthp}</td>
        `;
        this.tbody.appendChild(tr);
      });
      this.reportFooter.innerHTML = `Số sinh viên: ${data.length}`;

    } else if (type === 'phieu_diem') {
      this.thead.innerHTML = `
        <tr>
          <th width="60">STT</th>
          <th>Tên môn học</th>
          <th width="150" style="text-align: center; font-weight: bold; color: var(--primary-color);">Điểm Hết Môn</th>
        </tr>
      `;
      data.forEach((row, index) => {
        const tr = document.createElement('tr');
        const kthp = row.DIEM_KTHP !== null ? (Math.round(row.DIEM_KTHP * 100) / 100) : '-';
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td style="font-weight: 600;">${row.TENMH || ''}</td>
          <td style="text-align: center; font-weight: 700; color: var(--primary-color);">${kthp}</td>
        `;
        this.tbody.appendChild(tr);
      });

    } else if (type === 'bang_diem_tk') {
      // Dynamic Cross-Tab headers based on keys in dynamic pivot result
      const sample = data[0];
      const excludedKeys = ['MASV', 'HO', 'TEN'];
      const subjectKeys = Object.keys(sample).filter(k => !excludedKeys.includes(k));

      let headHtml = `
        <tr>
          <th width="150">Mã SV</th>
          <th>Họ tên</th>
      `;
      subjectKeys.forEach(subj => {
        headHtml += `<th style="text-align: center; min-width: 100px;">${subj}</th>`;
      });
      headHtml += '</tr>';
      this.thead.innerHTML = headHtml;

      data.forEach(row => {
        const tr = document.createElement('tr');
        let rowHtml = `
          <td style="font-weight: 600;">${row.MASV || ''}</td>
          <td>${row.HO || ''} ${row.TEN || ''}</td>
        `;
        subjectKeys.forEach(subj => {
          const score = row[subj] !== null ? (Math.round(row[subj] * 100) / 100) : '-';
          rowHtml += `<td style="text-align: center; font-weight: 500;">${score}</td>`;
        });
        tr.innerHTML = rowHtml;
        this.tbody.appendChild(tr);
      });
      this.reportFooter.innerHTML = `Số lượng sinh viên: ${data.length}`;
    }
  },

  exportToExcel() {
    const type = this.state.reportType;
    if (!type || this.state.activeData.length === 0) return;

    let filename = `bao_cao_${type}_${new Date().toISOString().slice(0,10)}.csv`;
    const table = document.getElementById('reportTable');
    if (!table) return;

    let csv = [];
    
    // Add Report Meta
    const reportTitle = this.reportHeader.querySelector('h2').innerText;
    const reportSub = this.reportHeader.querySelector('p').innerText.replace(/\n/g, ' - ');
    csv.push(`"${reportTitle}"`);
    csv.push(`"${reportSub}"`);
    csv.push(''); // Empty line divider

    // Add Table Rows
    const rows = table.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
      const row = [];
      const cols = rows[i].querySelectorAll('td, th');
      for (let j = 0; j < cols.length; j++) {
        let text = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/\s\s+/g, ' ');
        text = text.replace(/"/g, '""'); // Escape double quotes
        row.push(`"${text}"`);
      }
      csv.push(row.join(','));
    }

    // Add Footer divider
    if (this.reportFooter.innerText) {
      csv.push('');
      csv.push(`"${this.reportFooter.innerText}"`);
    }

    // UTF-8 BOM to display accented characters in Excel (Vietnamese support)
    const CSV_CONTENT = '\uFEFF' + csv.join('\n');
    const blob = new Blob([CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    Toast.success('Đã tải xuống bảng tính Excel (CSV)');
  }
};

// Auto-run ifLoaded
if (document.getElementById('reportTypeSelect')) {
  window.ReportsModule.init();
} else {
  // Listen for navigation triggers
  document.addEventListener('pageLoaded', (e) => {
    if (e.detail.pageId === 'reports') {
      window.ReportsModule.init();
    }
  });
}
