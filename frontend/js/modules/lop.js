window.LopModule = {
  allLops: [], // Lưu trữ toàn bộ dữ liệu lớp học từ API
  async init() {
    this.tbody = document.querySelector('#pageContent tbody');
    this.searchLop = document.getElementById('searchLop');
    this.filterKhoaHoc = document.getElementById('filterKhoaHoc');
    this.filterKhoa = document.getElementById('filterKhoa');
    
    this.bindEvents();
    await this.loadData();
  },
  bindEvents() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';
    const btnAdd = document.getElementById('btnAddLop');
    if (btnAdd) {
      if (isPGV) {
        btnAdd.onclick = () => Toast.info('Chức năng thêm lớp của PGV');
      } else {
        btnAdd.style.display = 'none';
      }
    }

    // Sự kiện nhập liệu tìm kiếm
    if (this.searchLop) {
      this.searchLop.addEventListener('input', () => this.filterAndRenderData());
    }
    // Sự kiện thay đổi bộ lọc khóa học
    if (this.filterKhoaHoc) {
      this.filterKhoaHoc.addEventListener('change', () => this.filterAndRenderData());
    }
    // Sự kiện thay đổi bộ lọc khoa
    if (this.filterKhoa) {
      this.filterKhoa.addEventListener('change', () => this.filterAndRenderData());
    }
  },
  async loadData() {
    try {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
      const res = await API.get('/lop');
      if (res.success) {
        this.allLops = res.data || [];
        
        // Khởi tạo các tùy chọn cho dropdown
        this.initFilterOptions();
        
        // Render dữ liệu lần đầu
        this.filterAndRenderData();
      }
    } catch (error) { 
      Toast.error(error.message); 
    }
  },
  initFilterOptions() {
    // 1. Tạo danh sách Khóa học (Distinct KHOAHOC)
    if (this.filterKhoaHoc) {
      this.filterKhoaHoc.innerHTML = '<option value="ALL">Tất cả Khóa học</option>';
      const distinctKhoaHoc = [...new Set(this.allLops.map(item => item.KHOAHOC).filter(Boolean))].sort();
      distinctKhoaHoc.forEach(kh => {
        const opt = document.createElement('option');
        opt.value = kh;
        opt.textContent = kh;
        this.filterKhoaHoc.appendChild(opt);
      });
    }

    // 2. Tạo danh sách Khoa (Distinct MAKHOA)
    if (this.filterKhoa) {
      this.filterKhoa.innerHTML = '<option value="ALL">Tất cả Khoa</option>';
      const distinctKhoa = [...new Set(this.allLops.map(item => item.MAKHOA).filter(Boolean))].sort();
      distinctKhoa.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k;
        this.filterKhoa.appendChild(opt);
      });
    }
  },
  filterAndRenderData() {
    const keyword = this.searchLop ? this.searchLop.value.trim().toLowerCase() : '';
    const selectedKhoaHoc = this.filterKhoaHoc ? this.filterKhoaHoc.value : 'ALL';
    const selectedKhoa = this.filterKhoa ? this.filterKhoa.value : 'ALL';

    // Lọc mảng dữ liệu lớp học
    const filtered = this.allLops.filter(item => {
      // Tìm kiếm theo Mã lớp hoặc Tên lớp
      const matchesSearch = !keyword || 
        (item.MALOP && item.MALOP.toLowerCase().includes(keyword)) ||
        (item.TENLOP && item.TENLOP.toLowerCase().includes(keyword));

      // Lọc theo Khóa học (Khóa học/Cohort)
      const matchesKhoaHoc = selectedKhoaHoc === 'ALL' || item.KHOAHOC === selectedKhoaHoc;

      // Lọc theo Khoa
      const matchesKhoa = selectedKhoa === 'ALL' || item.MAKHOA === selectedKhoa;

      return matchesSearch && matchesKhoaHoc && matchesKhoa;
    });

    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';

    // Render kết quả ra bảng HTML
    this.tbody.innerHTML = filtered.length === 0 
      ? '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">Không tìm thấy lớp học nào khớp với điều kiện lọc</td></tr>'
      : filtered.map((item, index) => {
        const actionBtn = isPGV
          ? `<button class="btn btn-secondary btn-sm">Sửa</button>`
          : `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;
        return `
        <tr>
          <td>${index + 1}</td>
          <td style="font-weight: 600;">${item.MALOP}</td>
          <td>${item.TENLOP}</td>
          <td>${item.KHOAHOC}</td>
          <td>${item.MAKHOA}</td>
          <td>${actionBtn}</td>
        </tr>`;
      }).join('');
  }
};
window.LopModule.init();
