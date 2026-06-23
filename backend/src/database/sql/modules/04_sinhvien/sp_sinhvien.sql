USE [QLDSV_HTC];
GO

-- =========================================================================
-- SUPPORTING INDEXES - SINHVIEN
-- =========================================================================

IF OBJECT_ID('dbo.IX_SINHVIEN_MALOP', 'IX') IS NULL
BEGIN
    CREATE INDEX IX_SINHVIEN_MALOP
    ON dbo.SINHVIEN (MALOP)
    INCLUDE (MASV, HO, TEN, PHAI, NGAYSINH, DIACHI, DANGHIHOC);
END;
GO


-- =========================================================================
-- STORED PROCEDURES - SINHVIEN
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_SINHVIEN
-- Description: Lấy toàn bộ danh sách sinh viên trong hệ thống.
-- Parameters: Không
-- Returns: Bảng danh sách sinh viên.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_SINHVIEN
AS
BEGIN
    SELECT MASV, HO, TEN, MALOP, PHAI, NGAYSINH, DIACHI, DANGHIHOC
    FROM SINHVIEN;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_SINHVIEN_BY_ID
-- Description: Lấy thông tin sinh viên cụ thể theo Mã Sinh viên.
-- Parameters:
--   - @MASV: Mã sinh viên cần lấy thông tin
-- Returns: Dòng thông tin sinh viên đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_SINHVIEN_BY_ID
    @MASV NCHAR(10)
AS
BEGIN
    SELECT MASV, HO, TEN, MALOP, PHAI, NGAYSINH, DIACHI, DANGHIHOC
    FROM SINHVIEN
    WHERE MASV = @MASV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_SINHVIEN_BY_LOP
-- Description: Lấy danh sách sinh viên thuộc về một Lớp cụ thể.
-- Parameters:
--   - @MALOP: Mã lớp học cần lọc sinh viên
-- Returns: Bảng chứa danh sách sinh viên của lớp đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_SINHVIEN_BY_LOP
    @MALOP NCHAR(10)
AS
BEGIN
    SELECT MASV, HO, TEN, MALOP, PHAI, NGAYSINH, DIACHI, DANGHIHOC
    FROM SINHVIEN
    WHERE MALOP = @MALOP;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_SINHVIEN_BY_KHOA
-- Description: Lấy danh sách toàn bộ sinh viên thuộc về một Khoa.
-- Parameters:
--   - @MAKHOA: Mã khoa
-- Returns: Bảng danh sách sinh viên thuộc các lớp của khoa này.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_SINHVIEN_BY_KHOA
    @MAKHOA NCHAR(10)
AS
BEGIN
    SELECT sv.MASV, sv.HO, sv.TEN, sv.MALOP, sv.PHAI, sv.NGAYSINH, sv.DIACHI, sv.DANGHIHOC
    FROM SINHVIEN sv
    INNER JOIN LOP l ON sv.MALOP = l.MALOP
    WHERE l.MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_SINHVIEN
-- Description: Thêm mới một sinh viên vào cơ sở dữ liệu.
-- Parameters:
--   - @MASV: Mã sinh viên (Khóa chính)
--   - @HO: Họ đệm
--   - @TEN: Tên sinh viên
--   - @MALOP: Mã lớp
--   - @PHAI: Giới tính (Bit: 1 là Nam, 0 là Nữ)
--   - @NGAYSINH: Ngày sinh
--   - @DIACHI: Địa chỉ thường trú
--   - @DANGHIHOC: Trạng thái nghỉ học (1: Đã nghỉ, 0: Đang học)
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_SINHVIEN
    @MASV NCHAR(10),
    @HO NVARCHAR(50),
    @TEN NVARCHAR(10),
    @MALOP NCHAR(10),
    @PHAI BIT,
    @NGAYSINH DATE = NULL,
    @DIACHI NVARCHAR(100) = NULL,
    @DANGHIHOC BIT = 0
AS
BEGIN
    INSERT INTO SINHVIEN (MASV, HO, TEN, MALOP, PHAI, NGAYSINH, DIACHI, DANGHIHOC)
    VALUES (@MASV, @HO, @TEN, @MALOP, @PHAI, @NGAYSINH, @DIACHI, @DANGHIHOC);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_SINHVIEN
-- Description: Cập nhật toàn bộ thông tin của một sinh viên đã tồn tại.
-- Parameters:
--   - @MASV: Mã sinh viên cần cập nhật
--   - @HO: Họ đệm mới
--   - @TEN: Tên mới
--   - @MALOP: Mã lớp mới
--   - @PHAI: Giới tính mới
--   - @NGAYSINH: Ngày sinh mới
--   - @DIACHI: Địa chỉ mới
--   - @DANGHIHOC: Trạng thái nghỉ học mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_SINHVIEN
    @MASV NCHAR(10),
    @HO NVARCHAR(50),
    @TEN NVARCHAR(10),
    @MALOP NCHAR(10),
    @PHAI BIT,
    @NGAYSINH DATE = NULL,
    @DIACHI NVARCHAR(100) = NULL,
    @DANGHIHOC BIT = 0
AS
BEGIN
    UPDATE SINHVIEN
    SET HO = @HO,
        TEN = @TEN,
        MALOP = @MALOP,
        PHAI = @PHAI,
        NGAYSINH = @NGAYSINH,
        DIACHI = @DIACHI,
        DANGHIHOC = @DANGHIHOC
    WHERE MASV = @MASV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DELETE_SINHVIEN
-- Description: Xóa hẳn sinh viên khỏi cơ sở dữ liệu.
-- Parameters:
--   - @MASV: Mã sinh viên cần xóa
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DELETE_SINHVIEN
    @MASV NCHAR(10)
AS
BEGIN
    DELETE FROM SINHVIEN
    WHERE MASV = @MASV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_RESTORE_SINHVIEN
-- Description: Khôi phục trạng thái đi học cho sinh viên bằng cách đặt DANGHIHOC = 0.
-- Parameters:
--   - @MASV: Mã sinh viên cần khôi phục
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_RESTORE_SINHVIEN
    @MASV NCHAR(10)
AS
BEGIN
    UPDATE SINHVIEN
    SET DANGHIHOC = 0
    WHERE MASV = @MASV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_SEARCH_SINHVIEN
-- Description: Tìm sinh viên theo Mã SV, Họ, Tên, hoặc Họ Tên đầy đủ.
-- Parameters:
--   - @KEYWORD: Từ khóa tìm kiếm
-- Returns: Danh sách sinh viên khớp từ khóa.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_SEARCH_SINHVIEN
    @KEYWORD NVARCHAR(100)
AS
BEGIN
    SELECT MASV, HO, TEN, MALOP, PHAI, NGAYSINH, DIACHI, DANGHIHOC
    FROM SINHVIEN
    WHERE MASV LIKE '%' + @KEYWORD + '%' 
       OR HO LIKE '%' + @KEYWORD + '%' 
       OR TEN LIKE '%' + @KEYWORD + '%' 
       OR HO + ' ' + TEN LIKE '%' + @KEYWORD + '%';
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_SINHVIEN_STATUS
-- Description: Cập nhật nhanh trạng thái nghỉ học/đang học cho sinh viên.
-- Parameters:
--   - @MASV: Mã sinh viên cần cập nhật
--   - @DANGHIHOC: Trạng thái mới (1 hoặc 0)
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_SINHVIEN_STATUS
    @MASV NCHAR(10),
    @DANGHIHOC BIT
AS
BEGIN
    UPDATE SINHVIEN
    SET DANGHIHOC = @DANGHIHOC
    WHERE MASV = @MASV;
END;
GO
