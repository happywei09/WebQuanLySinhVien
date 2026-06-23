USE [QLDSV_HTC];
GO

-- =========================================================================
-- SUPPORTING INDEXES - GIANGVIEN
-- =========================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_GIANGVIEN_MAKHOA' 
      AND object_id = OBJECT_ID('dbo.GIANGVIEN')
)
BEGIN
    CREATE INDEX IX_GIANGVIEN_MAKHOA
    ON dbo.GIANGVIEN (MAKHOA)
    INCLUDE (MAGV, HO, TEN, HOCVI, HOCHAM, CHUYENMON);
END;
GO

-- =========================================================================
-- STORED PROCEDURES - GIANGVIEN
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_GIANGVIEN
-- Description: Lấy toàn bộ danh sách giảng viên trong hệ thống.
-- Parameters: Không
-- Returns: Bảng chứa danh sách tất cả các giảng viên.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_GIANGVIEN
AS
BEGIN
    SELECT MAGV, MAKHOA, HO, TEN, HOCVI, HOCHAM, CHUYENMON
    FROM GIANGVIEN;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_GIANGVIEN_BY_ID
-- Description: Lấy chi tiết thông tin của giảng viên theo Mã Giảng viên.
-- Parameters:
--   - @MAGV: Mã giảng viên cần tra cứu
-- Returns: Dòng thông tin giảng viên đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_GIANGVIEN_BY_ID
    @MAGV NCHAR(10)
AS
BEGIN
    SELECT MAGV, MAKHOA, HO, TEN, HOCVI, HOCHAM, CHUYENMON
    FROM GIANGVIEN
    WHERE MAGV = @MAGV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_GIANGVIEN_BY_KHOA
-- Description: Lấy danh sách giảng viên trực thuộc một Khoa.
-- Parameters:
--   - @MAKHOA: Mã khoa
-- Returns: Bảng danh sách giảng viên của khoa đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_GIANGVIEN_BY_KHOA
    @MAKHOA NCHAR(10)
AS
BEGIN
    SELECT MAGV, MAKHOA, HO, TEN, HOCVI, HOCHAM, CHUYENMON
    FROM GIANGVIEN
    WHERE MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_GIANGVIEN
-- Description: Thêm mới một giảng viên vào cơ sở dữ liệu.
-- Parameters:
--   - @MAGV: Mã giảng viên
--   - @MAKHOA: Mã khoa
--   - @HO: Họ đệm
--   - @TEN: Tên giảng viên
--   - @HOCVI: Học vị (ví dụ: 'Thạc sĩ', 'Tiến sĩ')
--   - @HOCHAM: Học hàm (ví dụ: 'Phó giáo sư', 'Giáo sư')
--   - @CHUYENMON: Chuyên môn giảng dạy
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_GIANGVIEN
    @MAGV NCHAR(10),
    @MAKHOA NCHAR(10),
    @HO NVARCHAR(50),
    @TEN NVARCHAR(10),
    @HOCVI NVARCHAR(20),
    @HOCHAM NVARCHAR(20),
    @CHUYENMON NVARCHAR(50)
AS
BEGIN
    INSERT INTO GIANGVIEN (MAGV, MAKHOA, HO, TEN, HOCVI, HOCHAM, CHUYENMON)
    VALUES (@MAGV, @MAKHOA, @HO, @TEN, @HOCVI, @HOCHAM, @CHUYENMON);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_GIANGVIEN
-- Description: Cập nhật thông tin giảng viên đã tồn tại.
-- Parameters:
--   - @MAGV: Mã giảng viên cần sửa
--   - @MAKHOA: Mã khoa mới
--   - @HO: Họ đệm mới
--   - @TEN: Tên mới
--   - @HOCVI: Học vị mới
--   - @HOCHAM: Học hàm mới
--   - @CHUYENMON: Chuyên môn mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_GIANGVIEN
    @MAGV NCHAR(10),
    @MAKHOA NCHAR(10),
    @HO NVARCHAR(50),
    @TEN NVARCHAR(10),
    @HOCVI NVARCHAR(20),
    @HOCHAM NVARCHAR(20),
    @CHUYENMON NVARCHAR(50)
AS
BEGIN
    UPDATE GIANGVIEN
    SET MAKHOA = @MAKHOA,
        HO = @HO,
        TEN = @TEN,
        HOCVI = @HOCVI,
        HOCHAM = @HOCHAM,
        CHUYENMON = @CHUYENMON
    WHERE MAGV = @MAGV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DELETE_GIANGVIEN
-- Description: Xóa một giảng viên khỏi cơ sở dữ liệu.
-- Parameters:
--   - @MAGV: Mã giảng viên cần xóa
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DELETE_GIANGVIEN
    @MAGV NCHAR(10)
AS
BEGIN
    DELETE FROM GIANGVIEN
    WHERE MAGV = @MAGV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_RESTORE_GIANGVIEN
-- Description: Khôi phục giảng viên đã xóa (Tính năng No-op).
-- Parameters:
--   - @MAGV: Mã giảng viên cần khôi phục
-- Returns: Trả về 1
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_RESTORE_GIANGVIEN
    @MAGV NCHAR(10)
AS
BEGIN
    -- No-op
    SELECT 1;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_SEARCH_GIANGVIEN
-- Description: Tìm kiếm giảng viên theo mã, họ, tên, hoặc họ tên đầy đủ.
-- Parameters:
--   - @KEYWORD: Từ khóa tìm kiếm
-- Returns: Danh sách các giảng viên khớp từ khóa.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_SEARCH_GIANGVIEN
    @KEYWORD NVARCHAR(100)
AS
BEGIN
    SELECT MAGV, MAKHOA, HO, TEN, HOCVI, HOCHAM, CHUYENMON
    FROM GIANGVIEN
    WHERE MAGV LIKE '%' + @KEYWORD + '%' 
       OR HO LIKE '%' + @KEYWORD + '%' 
       OR TEN LIKE '%' + @KEYWORD + '%' 
       OR HO + ' ' + TEN LIKE '%' + @KEYWORD + '%';
END;
GO
