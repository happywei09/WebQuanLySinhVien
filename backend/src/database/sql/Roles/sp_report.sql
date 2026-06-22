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
            CASE 
                WHEN dk.DIEM_CK IS NULL THEN NULL  -- Chưa nhập điểm → không tính
                ELSE ISNULL(dk.DIEM_CC, 0) * 0.1 + ISNULL(dk.DIEM_GK, 0) * 0.3 + dk.DIEM_CK * 0.6
            END AS DIEM
        FROM FilteredDangKy dk
        INNER JOIN LOPTINCHI ltc ON dk.MALTC = ltc.MALTC
        INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    ),
    BestScorePerSubject AS (
        SELECT
            MAMH,
            TENMH,
            MAX(DIEM) AS DIEM
        FROM ScoreBySubject
        WHERE DIEM IS NOT NULL  -- Bỏ môn chưa nhập điểm
        GROUP BY MAMH, TENMH
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY TENMH) AS STT,
        TENMH,
        DIEM
    FROM BestScorePerSubject
    ORDER BY TENMH;
END;
GO

-- BÁO CÁO: Bảng điểm tổng kết theo lớp (Dynamic Pivot + Bảng tạm)
CREATE OR ALTER PROCEDURE SP_REPORT_BANGDIEM_TONGKET
    @MALOP NCHAR(10)
AS
BEGIN
    -- ===== BẢNG TẠM: Gom dữ liệu điểm thô, chỉ lấy SV có đăng ký =====
    -- Dùng INNER JOIN thay vì LEFT JOIN để tránh phình bảng tạm với NULL rows
    SELECT 
        sv.MASV,
        sv.HO,
        sv.TEN,
        mh.TENMH,
        CASE 
            WHEN dk.DIEM_CK IS NULL THEN NULL
            ELSE ISNULL(dk.DIEM_CC, 0) * 0.1 + ISNULL(dk.DIEM_GK, 0) * 0.3 + dk.DIEM_CK * 0.6
        END AS DIEM_KTHP
    INTO #DiemRaw
    FROM SINHVIEN sv
    INNER JOIN DANGKY dk ON sv.MASV = dk.MASV AND dk.HUYDANGKY = 0
    INNER JOIN LOPTINCHI ltc ON dk.MALTC = ltc.MALTC
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    WHERE sv.MALOP = @MALOP;

    -- Tạo index giúp PIVOT đọc nhanh theo TENMH
    CREATE NONCLUSTERED INDEX IX_DiemRaw_TENMH ON #DiemRaw (TENMH) INCLUDE (MASV, HO, TEN, DIEM_KTHP);

    -- Lấy danh sách tên môn học từ bảng tạm
    DECLARE @cols AS NVARCHAR(MAX),
            @query AS NVARCHAR(MAX);

    SELECT @cols = COALESCE(@cols + ', ', '') + QUOTENAME(TENMH)
    FROM (SELECT DISTINCT TENMH FROM #DiemRaw WHERE TENMH IS NOT NULL) AS Subjects;

    IF @cols IS NULL OR @cols = ''
    BEGIN
        -- Trả về danh sách sinh viên cơ bản nếu chưa có đăng ký môn nào
        SELECT DISTINCT MASV, HO, TEN 
        FROM SINHVIEN 
        WHERE MALOP = @MALOP;
        DROP TABLE #DiemRaw;
        RETURN;
    END

    -- PIVOT chỉ trên bảng tạm nhỏ - không cần JOIN lại 4 bảng lớn
    SET @query = N'
    SELECT MASV, HO, TEN, ' + @cols + N'
    FROM #DiemRaw
    PIVOT (
        MAX(DIEM_KTHP)
        FOR TENMH IN (' + @cols + N')
    ) piv;';

    EXEC sp_executesql @query;

    DROP TABLE #DiemRaw;
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

-- BÁO CÁO: Danh sách lớp tín chỉ của niên khoá + học kỳ (Bảng tạm)
CREATE OR ALTER PROCEDURE SP_REPORT_DS_LOPTINCHI
    @NIENKHOA NCHAR(9),
    @HOCKY INT
AS
BEGIN
    -- ===== BẢNG TẠM: Chỉ đếm SV đăng ký cho các lớp thuộc niên khóa + học kỳ cần báo cáo =====
    -- (Tránh quét toàn bộ DANGKY)
    SELECT dk.MALTC, COUNT(dk.MASV) AS SOSV_DANGKY
    INTO #SoSV_DangKy
    FROM DANGKY dk
    INNER JOIN LOPTINCHI ltc ON dk.MALTC = ltc.MALTC
    WHERE dk.HUYDANGKY = 0
      AND ltc.NIENKHOA = @NIENKHOA
      AND ltc.HOCKY = @HOCKY
      AND ltc.HUYLOP = 0
    GROUP BY dk.MALTC;

    ALTER TABLE #SoSV_DangKy ADD CONSTRAINT PK_SoSV_DangKy PRIMARY KEY CLUSTERED (MALTC);

    -- Bước 2: JOIN bảng tạm (nhỏ) với các bảng danh mục
    SELECT 
        ltc.MALTC,
        mh.TENMH,
        ltc.NHOM,
        gv.HO + ' ' + gv.TEN AS HOTEN_GV,
        ltc.SOSVTOITHIEU,
        ISNULL(dk.SOSV_DANGKY, 0) AS SOSV_DANGKY
    FROM LOPTINCHI ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    LEFT JOIN #SoSV_DangKy dk ON dk.MALTC = ltc.MALTC
    WHERE ltc.NIENKHOA = @NIENKHOA 
      AND ltc.HOCKY = @HOCKY 
      AND ltc.HUYLOP = 0
    ORDER BY mh.TENMH, ltc.NHOM;

    DROP TABLE #SoSV_DangKy;
END;
GO
