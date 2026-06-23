USE [QLDSV_HTC];
GO

-- =========================================================================
-- STORED PROCEDURES - DASHBOARD
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_DASHBOARD_GET_FILTERS
-- Description: Lấy dữ liệu danh mục để phục vụ làm bộ lọc (Filter) trên Dashboard:
--              Recordset 0: Danh sách khoa (Mã khoa, Tên khoa)
--              Recordset 1: Danh sách Niên khóa và Học kỳ có mở lớp tín chỉ.
-- Parameters: Không
-- Returns: Hai Recordsets dữ liệu.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DASHBOARD_GET_FILTERS
AS
BEGIN
    -- Recordset 0: Danh sách Khoa
    SELECT MAKHOA, TENKHOA FROM KHOA;
    
    -- Recordset 1: Danh sách Niên khóa, Học kỳ từ Lớp tín chỉ
    SELECT DISTINCT NIENKHOA, HOCKY FROM LOPTINCHI;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DASHBOARD_GET_STATS
-- Description: Lấy số liệu thống kê tổng hợp và chi tiết của các lớp tín chỉ mở.
--              Recordset 0: Thống kê tổng số sinh viên, số lớp đang mở, tổng số lớp và tổng lượt đăng ký.
--              Recordset 1: Danh sách chi tiết các lớp tín chỉ bao gồm thông tin môn học, sĩ số đăng ký hiện tại.
-- Parameters:
--   - @MAKHOA: Mã khoa lọc thống kê (Mặc định NULL)
--   - @NIENKHOA: Niên khóa lọc thống kê (Mặc định NULL)
--   - @HOCKY: Học kỳ lọc thống kê (Mặc định NULL)
-- Returns: Hai Recordsets thống kê dữ liệu.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DASHBOARD_GET_STATS
    @MAKHOA NCHAR(10) = NULL,
    @NIENKHOA NCHAR(9) = NULL,
    @HOCKY INT = NULL
AS
BEGIN
    -- ===== BẢNG TẠM 1: Lọc LOPTINCHI 1 lần duy nhất =====
    SELECT MALTC, MAMH, NHOM, MAGV, SOSVTOITHIEU, HUYLOP
    INTO #FilteredLopTinChi
    FROM LOPTINCHI
    WHERE (@MAKHOA IS NULL OR MAKHOA = @MAKHOA)
      AND (@NIENKHOA IS NULL OR NIENKHOA = @NIENKHOA)
      AND (@HOCKY IS NULL OR HOCKY = @HOCKY);

    -- Tạo PK giúp Optimizer chọn Nested Loop thay vì Hash Join
    ALTER TABLE #FilteredLopTinChi ADD CONSTRAINT PK_FilteredLTC PRIMARY KEY CLUSTERED (MALTC);

    -- ===== BẢNG TẠM 2: Đếm số SV đăng ký 1 lần, dùng chung cho cả 2 Recordset =====
    SELECT fltc.MALTC, COUNT(dk.MASV) AS SOSVDANGKY
    INTO #DangKyCount
    FROM #FilteredLopTinChi fltc
    LEFT JOIN DANGKY dk ON dk.MALTC = fltc.MALTC AND dk.HUYDANGKY = 0
    GROUP BY fltc.MALTC;

    ALTER TABLE #DangKyCount ADD CONSTRAINT PK_DKCount PRIMARY KEY CLUSTERED (MALTC);

    -- Recordset 0: Thống kê tổng quan
    DECLARE @TotalStudents INT;
    DECLARE @OpenClasses INT;
    DECLARE @TotalClasses INT;
    DECLARE @TotalRegistrations INT;

    SELECT @TotalStudents = COUNT(sv.MASV)
    FROM SINHVIEN sv
    INNER JOIN LOP l ON sv.MALOP = l.MALOP
    WHERE (@MAKHOA IS NULL OR l.MAKHOA = @MAKHOA);

    SELECT
        @OpenClasses = SUM(CASE WHEN fltc.HUYLOP = 0 THEN 1 ELSE 0 END),
        @TotalClasses = COUNT(*),
        @TotalRegistrations = SUM(dkc.SOSVDANGKY)
    FROM #FilteredLopTinChi fltc
    INNER JOIN #DangKyCount dkc ON dkc.MALTC = fltc.MALTC;

    SELECT @TotalStudents AS TotalStudents,
           @OpenClasses AS OpenClasses,
           @TotalClasses AS TotalClasses,
           @TotalRegistrations AS TotalRegistrations;

    -- Recordset 1: Chi tiết các lớp tín chỉ (dùng lại cả 2 bảng tạm)
    SELECT 
        ltc.MALTC,
        mh.TENMH,
        ltc.NHOM,
        gv.HO + ' ' + gv.TEN AS TEN_GV,
        ltc.SOSVTOITHIEU,
        ISNULL(dkc.SOSVDANGKY, 0) AS SOSVDANGKY
    FROM #FilteredLopTinChi ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    LEFT JOIN #DangKyCount dkc ON dkc.MALTC = ltc.MALTC
    ORDER BY ltc.MALTC DESC;

    DROP TABLE #DangKyCount;
    DROP TABLE #FilteredLopTinChi;
END;
GO
