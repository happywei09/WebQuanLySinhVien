USE [QLDSV_HTC];
GO

-- =========================================================================
-- SUPPORTING INDEXES - DANGKY
-- =========================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_DANGKY_MASV' 
      AND object_id = OBJECT_ID('dbo.DANGKY')
)
BEGIN
    CREATE INDEX IX_DANGKY_MASV
    ON dbo.DANGKY (MASV)
    INCLUDE (MALTC, DIEM_CC, DIEM_GK, DIEM_CK, HUYDANGKY);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_DANGKY_MALTC_HUYDANGKY' 
      AND object_id = OBJECT_ID('dbo.DANGKY')
)
BEGIN
    -- Index lọc HUYDANGKY=0 theo MALTC - giúp các SP lọc đăng ký active seek nhanh
    CREATE INDEX IX_DANGKY_MALTC_HUYDANGKY
    ON dbo.DANGKY (MALTC, HUYDANGKY)
    INCLUDE (MASV, DIEM_CC, DIEM_GK, DIEM_CK);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_DANGKY_MALTC_SI_SO' 
      AND object_id = OBJECT_ID('dbo.DANGKY')
)
BEGIN
    CREATE INDEX IX_DANGKY_MALTC_SI_SO
    ON dbo.DANGKY (MALTC)
    INCLUDE (MASV)
    WHERE HUYDANGKY = 0; -- Ngắn gọn, chuẩn cú pháp Filtered Index
END;
GO

-- =========================================================================
-- STORED PROCEDURES - DANGKY
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_DANGKY
-- Description: Lấy toàn bộ danh sách đăng ký tín chỉ của sinh viên.
-- Parameters: Không
-- Returns: Bảng danh sách đăng ký gồm Mã LTC, Mã SV, và Điểm số.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_DANGKY
AS
BEGIN
    SELECT MALTC, MASV, DIEM_CC, DIEM_GK, DIEM_CK, HUYDANGKY
    FROM DANGKY;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_DANGKY_BY_LOPTINCHI
-- Description: Lấy danh sách đăng ký còn hiệu lực (HUYDANGKY = 0) của một lớp tín chỉ.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần truy vấn
-- Returns: Bảng danh sách đăng ký thuộc lớp tín chỉ đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_DANGKY_BY_LOPTINCHI
    @MALTC INT
AS
BEGIN
    SELECT MALTC, MASV, DIEM_CC, DIEM_GK, DIEM_CK, HUYDANGKY
    FROM DANGKY
    WHERE MALTC = @MALTC AND HUYDANGKY = 0;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_DANGKY_BY_SINHVIEN
-- Description: Lấy danh sách các lớp tín chỉ sinh viên đã đăng ký thành công
--              và đang hoạt động, kèm theo tên môn học, tên giảng viên, học kỳ.
-- Parameters:
--   - @MASV: Mã sinh viên
-- Returns: Bảng danh sách lớp đăng ký kèm thông tin môn học/giảng viên.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_DANGKY_BY_SINHVIEN
    @MASV NCHAR(10)
AS
BEGIN
    SELECT 
        dk.MALTC, 
        dk.MASV, 
        dk.DIEM_CC, 
        dk.DIEM_GK, 
        dk.DIEM_CK, 
        dk.HUYDANGKY,
        ltc.MAMH,
        mh.TENMH,
        ltc.NHOM,
        ltc.MAGV,
        gv.HO + ' ' + gv.TEN AS TENGV,
        ltc.NIENKHOA,
        ltc.HOCKY
    FROM DANGKY dk
    INNER JOIN LOPTINCHI ltc ON dk.MALTC = ltc.MALTC
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    WHERE dk.MASV = @MASV AND (dk.HUYDANGKY = 0 OR dk.HUYDANGKY IS NULL);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_DANGKY
-- Description: Thực hiện đăng ký tín chỉ cho sinh viên. Sử dụng lệnh MERGE
--              để thực hiện Upsert (nếu đã có đăng ký trước đó thì cập nhật
--              lại trạng thái hủy và điểm, nếu chưa có thì thêm mới).
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ đăng ký
--   - @MASV: Mã sinh viên
--   - @DIEM_CC: Điểm chuyên cần
--   - @DIEM_GK: Điểm giữa kỳ
--   - @DIEM_CK: Điểm cuối kỳ
--   - @HUYDANGKY: Trạng thái hủy đăng ký (Bit)
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_DANGKY
    @MALTC INT,
    @MASV NCHAR(10),
    @DIEM_CC INT,
    @DIEM_GK FLOAT,
    @DIEM_CK FLOAT,
    @HUYDANGKY BIT
AS
BEGIN
    -- MERGE: Upsert 1 pass duy nhất thay vì IF EXISTS (2 lần quét bảng)
    MERGE DANGKY AS target
    USING (SELECT @MALTC, @MASV) AS source (MALTC, MASV)
      ON target.MALTC = source.MALTC AND target.MASV = source.MASV
    WHEN MATCHED THEN
        UPDATE SET HUYDANGKY = @HUYDANGKY,
                   DIEM_CC = @DIEM_CC,
                   DIEM_GK = @DIEM_GK,
                   DIEM_CK = @DIEM_CK
    WHEN NOT MATCHED THEN
        INSERT (MALTC, MASV, DIEM_CC, DIEM_GK, DIEM_CK, HUYDANGKY)
        VALUES (@MALTC, @MASV, @DIEM_CC, @DIEM_GK, @DIEM_CK, @HUYDANGKY);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_DANGKY
-- Description: Cập nhật thông tin chi tiết một dòng đăng ký (điểm số, trạng thái).
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ
--   - @MASV: Mã sinh viên
--   - @DIEM_CC: Điểm chuyên cần mới
--   - @DIEM_GK: Điểm giữa kỳ mới
--   - @DIEM_CK: Điểm cuối kỳ mới
--   - @HUYDANGKY: Trạng thái hủy mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_DANGKY
    @MALTC INT,
    @MASV NCHAR(10),
    @DIEM_CC INT,
    @DIEM_GK FLOAT,
    @DIEM_CK FLOAT,
    @HUYDANGKY BIT
AS
BEGIN
    UPDATE DANGKY
    SET DIEM_CC = @DIEM_CC,
        DIEM_GK = @DIEM_GK,
        DIEM_CK = @DIEM_CK,
        HUYDANGKY = @HUYDANGKY
    WHERE MALTC = @MALTC AND MASV = @MASV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DELETE_DANGKY
-- Description: Xóa hẳn dòng đăng ký môn học khỏi cơ sở dữ liệu.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ
--   - @MASV: Mã sinh viên
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DELETE_DANGKY
    @MALTC INT,
    @MASV NCHAR(10)
AS
BEGIN
    DELETE FROM DANGKY
    WHERE MALTC = @MALTC AND MASV = @MASV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CANCEL_DANGKY
-- Description: Hủy đăng ký lớp tín chỉ của sinh viên (Thiết lập HUYDANGKY = 1).
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ
--   - @MASV: Mã sinh viên
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CANCEL_DANGKY
    @MALTC INT,
    @MASV NCHAR(10)
AS
BEGIN
    UPDATE DANGKY
    SET HUYDANGKY = 1
    WHERE MALTC = @MALTC AND MASV = @MASV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_RESTORE_DANGKY
-- Description: Khôi phục lại trạng thái đăng ký của sinh viên (Đặt HUYDANGKY = 0).
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ
--   - @MASV: Mã sinh viên
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_RESTORE_DANGKY
    @MALTC INT,
    @MASV NCHAR(10)
AS
BEGIN
    UPDATE DANGKY
    SET HUYDANGKY = 0
    WHERE MALTC = @MALTC AND MASV = @MASV;
END;
GO
