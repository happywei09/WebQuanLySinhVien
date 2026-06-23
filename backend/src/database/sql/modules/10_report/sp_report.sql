USE [QLDSV_HTC];
GO

-- =========================================================================
-- STORED PROCEDURES - REPORTS
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_REPORT_BANGDIEM_MONHOC
-- Description: Lấy bảng điểm môn học của một lớp tín chỉ để phục vụ in ấn.
--              Tính điểm hết môn theo công thức: CC*0.1 + GK*0.3 + CK*0.6.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần lập bảng điểm
-- Returns: Danh sách sinh viên kèm điểm thành phần và điểm hết môn, sắp xếp theo Tên, Họ.
-- =========================================================================
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

-- =========================================================================
-- STORED PROCEDURE: SP_REPORT_PHIEUDIEM
-- Description: Lập phiếu điểm cá nhân của một sinh viên, liệt kê điểm hết môn
--              của toàn bộ các môn học đã đăng ký tích lũy. Nếu học nhiều lần,
--              lấy điểm của lần học có kết quả tốt nhất.
-- Parameters:
--   - @MASV: Mã sinh viên cần lập phiếu điểm
-- Returns: Bảng danh sách môn học kèm điểm thành phần và điểm tổng kết hết môn.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_REPORT_PHIEUDIEM
    @MASV NCHAR(10)
AS
BEGIN
    -- Cấu hình giúp tăng tốc độ xử lý câu lệnh, bỏ qua việc gửi các thông báo phụ về ứng dụng
    SET NOCOUNT ON;

    -- BƯỚC 1: Tạo bảng tạm thứ nhất hứng dữ liệu thô của sinh viên được truyền vào
    CREATE TABLE #FilteredDangKy (
        MALTC INT,
        DIEM_CC FLOAT,
        DIEM_GK FLOAT,
        DIEM_CK FLOAT,
        PRIMARY KEY (MALTC) -- Hỗ trợ tăng tốc truy vấn khi INNER JOIN ở bước sau
    );

    -- Đổ dữ liệu thô của @MASV vào bảng tạm 1
    INSERT INTO #FilteredDangKy (MALTC, DIEM_CC, DIEM_GK, DIEM_CK)
    SELECT MALTC, DIEM_CC, DIEM_GK, DIEM_CK
    FROM DANGKY
    WHERE MASV = @MASV AND HUYDANGKY = 0;

    -- BƯỚC 2: Tạo bảng tạm thứ hai chứa kết quả điểm đã tính toán và xếp hạng
    CREATE TABLE #ScoreBySubject (
        TENMH NVARCHAR(100),
        DIEM_CC FLOAT,
        DIEM_GK FLOAT,
        DIEM_CK FLOAT,
        DIEM FLOAT,
        NIENKHOA VARCHAR(20),
        HOCKY INT,
        rn INT
    );

    -- Tính điểm hệ số và đánh số thứ tự (ROW_NUMBER) theo luật ưu tiên
    INSERT INTO #ScoreBySubject
    SELECT
        mh.TENMH,
        dk.DIEM_CC,
        dk.DIEM_GK,
        dk.DIEM_CK,
        CASE 
            WHEN dk.DIEM_CK IS NULL THEN NULL 
            ELSE ISNULL(dk.DIEM_CC, 0) * 0.1 + ISNULL(dk.DIEM_GK, 0) * 0.3 + dk.DIEM_CK * 0.6
        END AS DIEM,
        ltc.NIENKHOA,
        ltc.HOCKY,
        ROW_NUMBER() OVER (
            PARTITION BY ltc.MAMH -- Nhóm theo mã môn học
            ORDER BY 
                CASE WHEN dk.DIEM_CK IS NULL THEN 0 ELSE 1 END DESC, -- 1. Ưu tiên đã thi
                CASE 
                    WHEN dk.DIEM_CK IS NULL THEN NULL
                    ELSE ISNULL(dk.DIEM_CC, 0) * 0.1 + ISNULL(dk.DIEM_GK, 0) * 0.3 + dk.DIEM_CK * 0.6
                END DESC, -- 2. Ưu tiên điểm cao
                ltc.NIENKHOA DESC, -- 3. Ưu tiên niên khóa mới
                ltc.HOCKY DESC -- 4. Ưu tiên học kỳ mới
        ) AS rn
    FROM #FilteredDangKy dk
    INNER JOIN LOPTINCHI ltc ON dk.MALTC = ltc.MALTC
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH;

    -- BƯỚC 3: Trả về kết quả phiếu điểm cuối cùng cho ứng dụng (Lọc lấy những dòng rn = 1)
    SELECT
        ROW_NUMBER() OVER (ORDER BY TENMH) AS STT,
        TENMH,
        DIEM_CC,
        DIEM_GK,
        DIEM_CK,
        DIEM,
        NIENKHOA,
        HOCKY
    FROM #ScoreBySubject
    WHERE rn = 1
    ORDER BY TENMH;

    -- BƯỚC 4: Giải phóng tài nguyên ngay trong Procedure
    DROP TABLE #FilteredDangKy;
    DROP TABLE #ScoreBySubject;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_REPORT_BANGDIEM_TONGKET
-- Description: Xuất bảng điểm tổng kết của một lớp học dạng PIVOT động.
--              Hiển thị danh sách sinh viên theo dòng và điểm hết môn các môn học theo cột.
-- Parameters:
--   - @MALOP: Mã lớp học cần lập bảng điểm tổng kết
-- Returns: Bảng PIVOT động chứa danh sách sinh viên và cột điểm của từng môn học.
-- =========================================================================
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

-- =========================================================================
-- STORED PROCEDURE: SP_REPORT_DSSV_DANGKY
-- Description: Lấy danh sách sinh viên đã đăng ký vào một lớp tín chỉ cụ thể.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ
-- Returns: Danh sách sinh viên (Mã SV, Họ, Tên, Phái, Mã lớp) đăng ký vào lớp tín chỉ này.
-- =========================================================================
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

-- =========================================================================
-- STORED PROCEDURE: SP_REPORT_DS_LOPTINCHI
-- Description: Lấy danh sách lớp tín chỉ được mở trong Niên khóa và Học kỳ
--              nhất định, có thống kê sĩ số đăng ký hiện tại của mỗi lớp.
-- Parameters:
--   - @NIENKHOA: Niên khóa
--   - @HOCKY: Học kỳ (1, 2, 3)
-- Returns: Bảng danh sách các lớp tín chỉ (Mã LTC, Tên môn học, Nhóm, Giảng viên, Sĩ số tối thiểu, Số đăng ký).
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_REPORT_DS_LOPTINCHI
    @NIENKHOA NCHAR(9),
    @HOCKY INT
AS
BEGIN
    SET NOCOUNT ON; -- Tối ưu băng thông mạng

    -- BƯỚC 1: Gom nhóm, lọc active và đếm sĩ số ném thẳng vào bảng tạm vật lý
    SELECT 
        dk_sub.MALTC, 
        COUNT(dk_sub.MASV) AS SOSV_DANGKY
    INTO #ThongKeDangKy
    FROM DANGKY dk_sub
    WHERE dk_sub.HUYDANGKY = 0 OR dk_sub.HUYDANGKY IS NULL
    GROUP BY dk_sub.MALTC;

    -- BƯỚC 2: "Vả" Clustered Index trực tiếp trên bảng tạm để phép LEFT JOIN phía dưới chạy bằng INDEX SEEK
    CREATE CLUSTERED INDEX IX_Temp_ThongKeDangKy_MALTC ON #ThongKeDangKy(MALTC);

    -- BƯỚC 3: Câu lệnh chính - JOIN các bảng danh mục mục tiêu với bảng tạm sạch
    SELECT 
        ltc.MALTC,
        mh.TENMH,
        ltc.NHOM,
        gv.HO + ' ' + gv.TEN AS HOTEN_GV,
        ltc.SOSVTOITHIEU,
        ISNULL(tk.SOSV_DANGKY, 0) AS SOSV_DANGKY, -- Nếu lớp trống (không khớp bảng tạm) thì hiện số 0
        k.TENKHOA,
        ltc.NIENKHOA,
        ltc.HOCKY
    FROM LOPTINCHI ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    INNER JOIN KHOA k ON ltc.MAKHOA = k.MAKHOA
    -- LEFT JOIN với bảng tạm siêu nhỏ đã có sẵn Index
    LEFT JOIN #ThongKeDangKy tk ON ltc.MALTC = tk.MALTC
    WHERE ltc.NIENKHOA = @NIENKHOA 
      AND ltc.HOCKY = @HOCKY 
      AND ltc.HUYLOP = 0
    ORDER BY mh.TENMH, ltc.NHOM;

    -- BƯỚC 4: Xóa bảng tạm để dọn dẹp sạch sẽ tài nguyên vùng tempdb
    DROP TABLE #ThongKeDangKy;
END;
GO
