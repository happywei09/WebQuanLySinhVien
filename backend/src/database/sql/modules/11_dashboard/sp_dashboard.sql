USE [QLDSV_HTC];
GO

-- =========================================================================
-- STORED PROCEDURES - DASHBOARD
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_DASHBOARD_GET_FILTERS
-- Description: Lấy dữ liệu danh mục để phục vụ làm bộ lọc:
--              Recordset 0: Danh sách khoa (Mã khoa, Tên khoa)
--              Recordset 1: Danh sách Niên khóa và Học kỳ có mở lớp tín chỉ.
-- Parameters: Không
-- Returns: Hai Recordsets dữ liệu.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DASHBOARD_GET_FILTERS
AS
BEGIN
    SELECT MAKHOA, TENKHOA FROM KHOA;
    SELECT DISTINCT NIENKHOA, HOCKY FROM LOPTINCHI;
END;
GO


-- =========================================================================
-- STORED PROCEDURE: SP_DASHBOARD_GET_STATS
-- Description: Lấy số liệu thống kê tổng hợp của toàn trường.
-- Parameters: Không
-- Returns: Một Recordset chứa 4 chỉ số thống kê.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DASHBOARD_GET_STATS
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TotalStudents INT;
    DECLARE @OpenClasses INT;
    DECLARE @TotalClasses INT;
    DECLARE @TotalRegistrations INT;

    -- 1. Tổng số sinh viên toàn trường
    SELECT @TotalStudents = COUNT(*) FROM SINHVIEN;

    -- 2. Lớp tín chỉ đang mở (HUYLOP = 0) và Tổng số lớp tín chỉ
    SELECT 
        @OpenClasses = ISNULL(SUM(CASE WHEN HUYLOP = 0 THEN 1 ELSE 0 END), 0),
        @TotalClasses = COUNT(*)
    FROM LOPTINCHI;

    -- 3. Tổng lượt đăng ký học thành công (chưa bị hủy)
    SELECT @TotalRegistrations = COUNT(*)
    FROM DANGKY
    WHERE HUYDANGKY = 0 OR HUYDANGKY IS NULL;

    -- Trả về recordset thống kê
    SELECT @TotalStudents AS TotalStudents,
           @OpenClasses AS OpenClasses,
           @TotalClasses AS TotalClasses,
           @TotalRegistrations AS TotalRegistrations;
END;
GO
