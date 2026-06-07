/* ====================================
   MODULE PHIẾU ĐIỂM CÁ NHÂN
   File: js/modules/phieudiem.js
 ==================================== */

window.PhieuDiemModule = {
  async init() {
    this.cacheDOM();
    await this.loadData();
  },

  cacheDOM() {
    this.container = document.getElementById('phieuDiemContainer');
    this.lblFullName = document.getElementById('pdFullName');
    this.lblMaSV = document.getElementById('pdMaSV');
  },

  async loadData() {
    try {
      const user = Auth.getUser();
      if (!user || user.role !== 'SINHVIEN') {
        this.container.innerHTML = '<div style="text-align: center; color: red; padding: 20px;">Chức năng này chỉ dành cho Sinh Viên.</div>';
        return;
      }

      this.lblFullName.textContent = user.fullName || user.username;
      this.lblMaSV.textContent = user.username;

      this.container.innerHTML = '<div style="text-align: center; padding: 20px;">⏳ Đang tải điểm...</div>';

      const res = await API.get(`/diem/sinhvien/${user.username}`);

      if (res.success) {
        this.renderTable(res.data.diemList || [], res.data.cpa, res.data.tinChiTichLuy, res.data.hocLuc, res.data.gpaPerSemester || []);
      } else {
        throw new Error(res.message || 'Lỗi tải phiếu điểm');
      }
    } catch (error) {
      this.container.innerHTML = '';
      const errDiv = document.createElement('div');
      errDiv.style = "text-align: center; color: red; padding: 20px;";
      errDiv.textContent = `Lỗi: ${error.message}`;
      this.container.appendChild(errDiv);
      Toast.error(error.message);
    }
  },

  renderTable(data, cpa, tinChiTichLuy, hocLuc, gpaPerSemester) {
    this.container.innerHTML = '';
    
    // Khung thống kê
    if (cpa !== undefined) {
      const statsDiv = document.createElement('div');
      statsDiv.className = 'card';
      statsDiv.style.marginBottom = '20px';
      statsDiv.style.padding = '20px';
      statsDiv.style.background = 'var(--primary-light)';
      statsDiv.innerHTML = `
        <h3 style="margin-top:0; color: var(--primary-color);">Kết quả học tập</h3>
        <div style="display: flex; gap: 20px; font-size: 16px;">
          <div><strong>Điểm Tích Lũy (CPA):</strong> <span style="color: var(--primary-color); font-weight: bold; font-size: 18px;">${cpa !== null ? cpa : 'Chưa có'}</span></div>
          <div><strong>Số Tín Chỉ Tích Lũy:</strong> <span>${tinChiTichLuy || 0}</span></div>
          <div><strong>Xếp Loại Học Lực:</strong> <span class="badge" style="background: var(--secondary-color); font-size: 14px;">${Utils.escapeHtml(hocLuc || '')}</span></div>
        </div>
      `;
      this.container.appendChild(statsDiv);
    }

    if (!data || data.length === 0) {
      this.container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Chưa có điểm môn học nào được ghi nhận.</div>';
      return;
    }

    // Nhóm điểm theo Niên khóa và Học kỳ (Hỗ trợ cả HOA và thường cho thuộc tính)
    const groups = {};
    data.forEach(row => {
      const nienKhoa = row.NIENKHOA || row.nienKhoa || 'Chưa rõ niên khóa';
      const hocKy = row.HOCKY || row.hocKy || 'Chưa rõ học kỳ';
      const groupKey = `${nienKhoa} - Học kỳ ${hocKy}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          nienKhoa,
          hocKy,
          subjects: []
        };
      }
      groups[groupKey].subjects.push(row);
    });

    // Sắp xếp các nhóm học kỳ theo thứ tự thời gian (tăng dần: niên khóa trước, học kỳ trước)
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const groupA = groups[a];
      const groupB = groups[b];

      // So sánh niên khóa
      if (String(groupA.nienKhoa) !== String(groupB.nienKhoa)) {
        return String(groupA.nienKhoa).localeCompare(String(groupB.nienKhoa));
      }
      // So sánh học kỳ
      return parseInt(groupA.hocKy || 0) - parseInt(groupB.hocKy || 0);
    });

    // Render từng nhóm học kỳ ra giao diện
    sortedGroupKeys.forEach(key => {
      const group = groups[key];

      // Xác định thuộc tính tên môn học (Case-insensitive)
      const firstRow = group.subjects[0];
      const keyTenMH = 'TENMH' in firstRow ? 'TENMH' :
        ('TEN_MH' in firstRow ? 'TEN_MH' :
          ('tenMH' in firstRow ? 'tenMH' :
            ('ten_mh' in firstRow ? 'ten_mh' : 'MAMH')));

      // Sắp xếp môn học theo bảng chữ cái tiếng Việt/tiếng Anh
      group.subjects.sort((a, b) => {
        const nameA = String(a[keyTenMH] || '').toUpperCase();
        const nameB = String(b[keyTenMH] || '').toUpperCase();
        return nameA.localeCompare(nameB);
      });

      // Tạo container cho mỗi học kỳ
      const section = document.createElement('div');
      section.className = 'semester-section card';
      section.style.marginBottom = '25px';
      section.style.overflow = 'hidden';
      section.style.boxShadow = 'var(--shadow-sm)';
      section.style.borderRadius = 'var(--radius-md)';
      section.style.border = '1px solid var(--border-color)';

      // Tiêu đề học kỳ
      const gpaObj = gpaPerSemester ? gpaPerSemester.find(g => g.nienKhoa == group.nienKhoa && g.hocKy == group.hocKy) : null;
      const gpaHtml = gpaObj && gpaObj.gpa !== null ? ` — GPA Học kỳ: <strong>${gpaObj.gpa}</strong>` : '';

      const header = document.createElement('div');
      header.className = 'semester-header';
      header.style.padding = '12px 20px';
      header.style.background = 'var(--primary-light)';
      header.style.borderBottom = '1px solid var(--border-color)';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.innerHTML = `
        <h4 style="margin: 0; color: var(--primary-color); display: flex; align-items: center; gap: 8px;">
          📅 Niên khóa: ${Utils.escapeHtml(group.nienKhoa)} — Học kỳ: ${Utils.escapeHtml(group.hocKy)}${gpaHtml}
        </h4>
        <span class="badge" style="background: var(--bg-hover); color: var(--text-color); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 12px; font-size: 12px;">
          ${group.subjects.length} môn học
        </span>
      `;
      section.appendChild(header);

      // Bảng điểm cho học kỳ
      const tableDiv = document.createElement('div');
      tableDiv.className = 'table-responsive';

      const table = document.createElement('table');
      table.className = 'table';
      table.style.margin = '0';

      table.innerHTML = `
        <thead>
          <tr>
            <th width="60" style="padding: 12px 15px; text-align: center;">STT</th>
            <th width="120" style="padding: 12px 15px;">Mã môn</th>
            <th style="padding: 12px 15px;">Tên môn học</th>
            <th width="80" style="text-align: center; padding: 12px 15px;">STC</th>
            <th width="80" style="text-align: center; padding: 12px 15px;">Điểm CC</th>
            <th width="80" style="text-align: center; padding: 12px 15px;">Điểm GK</th>
            <th width="80" style="text-align: center; padding: 12px 15px;">Điểm CK</th>
            <th width="80" style="text-align: center; padding: 12px 15px;">Hệ 10</th>
            <th width="80" style="text-align: center; padding: 12px 15px;">Hệ 4</th>
            <th width="80" style="text-align: center; padding: 12px 15px;">Điểm chữ</th>
          </tr>
        </thead>
      `;

      const tbody = document.createElement('tbody');
      group.subjects.forEach((row, index) => {
        const maMH = row.MAMH || row.mamh || row.maMH || '—';
        const tenMH = row[keyTenMH] || 'Không rõ tên môn';
        const stc = row.SOTC !== undefined ? row.SOTC : '—';

        // Điểm chi tiết (Hỗ trợ cả HOA và thường)
        const cc = row.DIEM_CC !== null && row.DIEM_CC !== undefined ? row.DIEM_CC :
          (row.diemCC !== null && row.diemCC !== undefined ? row.diemCC : '—');

        const gk = row.DIEM_GK !== null && row.DIEM_GK !== undefined ? row.DIEM_GK :
          (row.diemGK !== null && row.diemGK !== undefined ? row.diemGK : '—');

        const ck = row.DIEM_CK !== null && row.DIEM_CK !== undefined ? row.DIEM_CK :
          (row.diemCK !== null && row.diemCK !== undefined ? row.diemCK : '—');

        const he10 = row.DIEM_KTHP !== null && row.DIEM_KTHP !== undefined ? row.DIEM_KTHP : '—';
        const he4 = row.DIEM_HE4 !== null && row.DIEM_HE4 !== undefined ? row.DIEM_HE4 : '—';
        const diemChu = row.DIEM_CHU !== null && row.DIEM_CHU !== undefined ? row.DIEM_CHU : '—';

        let diemHtml10 = he10 !== '—' ? `<span style="font-weight: 700; color: var(--primary-color);">${he10}</span>` : '<span style="color: var(--text-muted);">-</span>';
        let diemHtml4 = he4 !== '—' ? `<strong>${he4}</strong>` : '-';
        let chuColor = diemChu === 'F' ? 'red' : 'var(--primary-color)';
        let diemChuHtml = diemChu !== '—' ? `<strong style="color:${chuColor}">${diemChu}</strong>` : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="padding: 12px 15px; text-align: center;">${index + 1}</td>
          <td style="padding: 12px 15px;"><code>${Utils.escapeHtml(maMH)}</code></td>
          <td style="padding: 12px 15px;"><strong>${Utils.escapeHtml(tenMH)}</strong></td>
          <td style="text-align: center; padding: 12px 15px;">${stc}</td>
          <td style="text-align: center; padding: 12px 15px; color: var(--text-muted);">${Utils.escapeHtml(cc)}</td>
          <td style="text-align: center; padding: 12px 15px; color: var(--text-muted);">${Utils.escapeHtml(gk)}</td>
          <td style="text-align: center; padding: 12px 15px; color: var(--text-muted);">${Utils.escapeHtml(ck)}</td>
          <td style="text-align: center; padding: 12px 15px;">${diemHtml10}</td>
          <td style="text-align: center; padding: 12px 15px;">${diemHtml4}</td>
          <td style="text-align: center; padding: 12px 15px;">${diemChuHtml}</td>
        `;
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      tableDiv.appendChild(table);
      section.appendChild(tableDiv);

      this.container.appendChild(section);
    });
  }
};

window.PhieuDiemModule.init();
