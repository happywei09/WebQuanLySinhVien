USE [QLDSV_HTC];
GO

-- =========================================================================
-- STORED PROCEDURES - DASHBOARD
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

CREATE OR ALTER PROCEDURE SP_DASHBOARD_GET_STATS
    @MAKHOA NCHAR(10) = NULL,
    @NIENKHOA NCHAR(9) = NULL,
    @HOCKY INT = NULL
AS
BEGIN
    -- Recordset 0: Thống kê tổng quan
    DECLARE @TotalStudents INT;
    DECLARE @OpenClasses INT;
    DECLARE @TotalClasses INT;
    DECLARE @TotalRegistrations INT;

    SELECT @TotalStudents = COUNT(sv.MASV)
    FROM SINHVIEN sv
    INNER JOIN LOP l ON sv.MALOP = l.MALOP
    WHERE (@MAKHOA IS NULL OR l.MAKHOA = @MAKHOA);

    ;WITH FilteredLopTinChi AS (
        SELECT ltc.MALTC, ltc.HUYLOP
        FROM LOPTINCHI ltc
        WHERE (@MAKHOA IS NULL OR ltc.MAKHOA = @MAKHOA)
          AND (@NIENKHOA IS NULL OR ltc.NIENKHOA = @NIENKHOA)
          AND (@HOCKY IS NULL OR ltc.HOCKY = @HOCKY)
    )
    SELECT
        @OpenClasses = COUNT(CASE WHEN fltc.HUYLOP = 0 THEN 1 END),
        @TotalClasses = COUNT(*) ,
        @TotalRegistrations = COUNT(dk.MASV)
    FROM FilteredLopTinChi fltc
    LEFT JOIN DANGKY dk
      ON dk.MALTC = fltc.MALTC
     AND dk.HUYDANGKY = 0;

    SELECT @TotalStudents AS TotalStudents,
           @OpenClasses AS OpenClasses,
           @TotalClasses AS TotalClasses,
           @TotalRegistrations AS TotalRegistrations;

    -- Recordset 1: Chi tiết các lớp tín chỉ
    ;WITH FilteredLopTinChi AS (
        SELECT MALTC, MAMH, NHOM, MAGV, SOSVTOITHIEU
        FROM LOPTINCHI ltc
        WHERE (@MAKHOA IS NULL OR ltc.MAKHOA = @MAKHOA)
          AND (@NIENKHOA IS NULL OR ltc.NIENKHOA = @NIENKHOA)
          AND (@HOCKY IS NULL OR ltc.HOCKY = @HOCKY)
    )
    SELECT 
        ltc.MALTC,
        mh.TENMH,
        ltc.NHOM,
        gv.HO + ' ' + gv.TEN AS TEN_GV,
        ltc.SOSVTOITHIEU,
        COUNT(dk.MASV) AS SOSVDANGKY
    FROM FilteredLopTinChi ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    LEFT JOIN DANGKY dk ON dk.MALTC = ltc.MALTC AND dk.HUYDANGKY = 0
    GROUP BY ltc.MALTC, mh.TENMH, ltc.NHOM, gv.HO, gv.TEN, ltc.SOSVTOITHIEU
    ORDER BY ltc.MALTC;
END;
GO
