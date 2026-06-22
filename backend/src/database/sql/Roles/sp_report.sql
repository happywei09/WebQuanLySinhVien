USE [QLDSV_HTC];
GO

-- =========================================================================
-- STORED PROCEDURES - REPORTS
-- =========================================================================

-- BÁO CÁO: Bảng điểm môn học theo lớp tín chỉ
CREATE OR ALTER PROCEDURE SP_REPORT_BANGDIEM_MONHOC
    @MALTC INT
AS
BEGIN
    SELECT 
        dk.MASV,
        sv.HO,
        sv.TEN,
        dk.DIEM_CC,
        dk.DIEM_GK,
        dk.DIEM_CK,
        (ISNULL(dk.DIEM_CC, 0) * 0.1 + ISNULL(dk.DIEM_GK, 0) * 0.3 + ISNULL(dk.DIEM_CK, 0) * 0.6) AS DIEM_KTHP
    FROM DANGKY dk
    INNER JOIN SINHVIEN sv ON dk.MASV = sv.MASV
    WHERE dk.MALTC = @MALTC AND dk.HUYDANGKY = 0
    ORDER BY sv.TEN, sv.HO;
END;
GO

-- BÁO CÁO: Phiếu điểm cá nhân sinh viên
CREATE OR ALTER PROCEDURE SP_REPORT_PHIEUDIEM
    @MASV NCHAR(10)
AS
BEGIN
    ;WITH FilteredDangKy AS (
        SELECT MALTC, DIEM_CC, DIEM_GK, DIEM_CK
        FROM DANGKY
        WHERE MASV = @MASV AND HUYDANGKY = 0
    ),
    ScoreBySubject AS (
        SELECT
            mh.MAMH,
            mh.TENMH,
            MAX(
                ISNULL(dk.DIEM_CC, 0) * 0.1 +
                ISNULL(dk.DIEM_GK, 0) * 0.3 +
                ISNULL(dk.DIEM_CK, 0) * 0.6
            ) AS DIEM
        FROM FilteredDangKy dk
        INNER JOIN LOPTINCHI ltc ON dk.MALTC = ltc.MALTC
        INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
        GROUP BY mh.MAMH, mh.TENMH
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY TENMH) AS STT,
        TENMH,
        DIEM
    FROM ScoreBySubject
    ORDER BY TENMH;
END;
GO

-- BÁO CÁO: Bảng điểm tổng kết theo lớp (Dynamic Pivot)
CREATE OR ALTER PROCEDURE SP_REPORT_BANGDIEM_TONGKET
    @MALOP NCHAR(10)
AS
BEGIN
    DECLARE @cols AS NVARCHAR(MAX),
            @query AS NVARCHAR(MAX);

    -- Lấy danh sách tên tất cả môn học mà sinh viên lớp này đã học/đăng ký
    SELECT @cols = COALESCE(@cols + ', ', '') + QUOTENAME(TENMH)
    FROM (
        SELECT DISTINCT mh.TENMH
        FROM DANGKY dk
        INNER JOIN SINHVIEN sv ON dk.MASV = sv.MASV
        INNER JOIN LOPTINCHI ltc ON dk.MALTC = ltc.MALTC
        INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
        WHERE sv.MALOP = @MALOP AND dk.HUYDANGKY = 0
    ) AS Subjects;

    IF @cols IS NULL OR @cols = ''
    BEGIN
        -- Trả về danh sách sinh viên cơ bản nếu chưa có đăng ký môn nào
        SELECT MASV, HO, TEN 
        FROM SINHVIEN 
        WHERE MALOP = @MALOP;
        RETURN;
    END

    -- Sử dụng Dynamic SQL để pivot kết quả điểm tổng kết
    SET @query = '
    SELECT MASV, HO, TEN, ' + @cols + '
    FROM (
        SELECT 
            sv.MASV,
            sv.HO,
            sv.TEN,
            mh.TENMH,
            (ISNULL(dk.DIEM_CC, 0) * 0.1 + ISNULL(dk.DIEM_GK, 0) * 0.3 + ISNULL(dk.DIEM_CK, 0) * 0.6) AS DIEM_KTHP
        FROM SINHVIEN sv
        LEFT JOIN DANGKY dk ON sv.MASV = dk.MASV AND dk.HUYDANGKY = 0
        LEFT JOIN LOPTINCHI ltc ON dk.MALTC = ltc.MALTC
        LEFT JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
        WHERE sv.MALOP = ''' + @MALOP + '''
    ) src
    PIVOT (
        MAX(DIEM_KTHP)
        FOR TENMH IN (' + @cols + ')
    ) piv;';

    EXEC sp_executesql @query;
END;
GO

-- BÁO CÁO: Danh sách sinh viên đăng ký lớp tín chỉ
CREATE OR ALTER PROCEDURE SP_REPORT_DSSV_DANGKY
    @MALTC INT
AS
BEGIN
    SELECT 
        sv.MASV,
        sv.HO,
        sv.TEN,
        sv.PHAI,
        sv.MALOP
    FROM DANGKY dk
    INNER JOIN SINHVIEN sv ON dk.MASV = sv.MASV
    WHERE dk.MALTC = @MALTC AND dk.HUYDANGKY = 0
    ORDER BY sv.TEN, sv.HO;
END;
GO

-- BÁO CÁO: Danh sách lớp tín chỉ của niên khoá + học kỳ
CREATE OR ALTER PROCEDURE SP_REPORT_DS_LOPTINCHI
    @NIENKHOA NCHAR(9),
    @HOCKY INT
AS
BEGIN
    ;WITH FilteredLopTinChi AS (
        SELECT MALTC, MAMH, NHOM, MAGV, SOSVTOITHIEU
        FROM LOPTINCHI
        WHERE NIENKHOA = @NIENKHOA 
          AND HOCKY = @HOCKY 
          AND HUYLOP = 0
    )
    SELECT 
        ltc.MALTC,
        mh.TENMH,
        ltc.NHOM,
        gv.HO + ' ' + gv.TEN AS HOTEN_GV,
        ltc.SOSVTOITHIEU,
        COUNT(dk.MASV) AS SOSV_DANGKY
    FROM FilteredLopTinChi ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    LEFT JOIN DANGKY dk ON dk.MALTC = ltc.MALTC AND dk.HUYDANGKY = 0
    GROUP BY ltc.MALTC, mh.TENMH, ltc.NHOM, gv.HO, gv.TEN, ltc.SOSVTOITHIEU
    ORDER BY mh.TENMH, ltc.NHOM;
END;
GO
