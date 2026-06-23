-- =========================================================================
-- STORED PROCEDURES & DATABASE INITIALIZATION SCRIPT - QLDSV_HTC
-- Target: SQL Server
-- Description: Reorganized into 11 distinct sections representing each module
-- =========================================================================

USE [QLDSV_HTC];
GO

-- =========================================================================
-- SECTION 01: SYSTEM AUTH (LOGINS, ROLES, PERMISSIONS, AND AUTH PROCEDURES)
-- =========================================================================

USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_pgv')
BEGIN
    CREATE LOGIN login_pgv WITH PASSWORD = '123', CHECK_POLICY = OFF;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_khoa')
BEGIN
    CREATE LOGIN login_khoa WITH PASSWORD = '123', CHECK_POLICY = OFF;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_sv')
BEGIN
    CREATE LOGIN login_sv WITH PASSWORD = '123456', CHECK_POLICY = OFF;
END;
GO

USE QLDSV_HTC;
GO

IF DATABASE_PRINCIPAL_ID('login_pgv') IS NULL
BEGIN
    CREATE USER login_pgv FOR LOGIN login_pgv;
END;
GO

IF DATABASE_PRINCIPAL_ID('login_khoa') IS NULL
BEGIN
    CREATE USER login_khoa FOR LOGIN login_khoa;
END;
GO

IF DATABASE_PRINCIPAL_ID('login_sv') IS NULL
BEGIN
    CREATE USER login_sv FOR LOGIN login_sv;
END;
GO

IF DATABASE_PRINCIPAL_ID('PGV') IS NULL
BEGIN
    CREATE ROLE PGV;
END;
GO

IF DATABASE_PRINCIPAL_ID('KHOA') IS NULL
BEGIN
    CREATE ROLE KHOA;
END;
GO

IF DATABASE_PRINCIPAL_ID('SV') IS NULL
BEGIN
    CREATE ROLE SV;
END;
GO

IF IS_ROLEMEMBER('PGV', 'login_pgv') = 0
BEGIN
    ALTER ROLE PGV ADD MEMBER login_pgv;
END;
GO

IF IS_ROLEMEMBER('KHOA', 'login_khoa') = 0
BEGIN
    ALTER ROLE KHOA ADD MEMBER login_khoa;
END;
GO

IF IS_ROLEMEMBER('SV', 'login_sv') = 0
BEGIN
    ALTER ROLE SV ADD MEMBER login_sv;
END;
GO

-- phan quyen phong giao vu 
IF IS_ROLEMEMBER('db_owner', 'login_pgv') = 0
BEGIN
    ALTER ROLE db_owner ADD MEMBER login_pgv;
END;
GO

/* PHÂN QUYỀN ROLE KHOA */

GRANT SELECT ON dbo.KHOA (MAKHOA, TENKHOA) TO KHOA;
GO
DENY INSERT, UPDATE, DELETE ON dbo.KHOA TO KHOA;
GO

GRANT SELECT ON dbo.LOP (MALOP, TENLOP, KHOAHOC, MAKHOA) TO KHOA;
GO
DENY INSERT, UPDATE, DELETE ON dbo.LOP TO KHOA;
GO

GRANT SELECT ON dbo.SINHVIEN (MASV, HO, TEN, MALOP, PHAI, NGAYSINH, DIACHI, DANGHIHOC) TO KHOA;
GO
DENY SELECT ON dbo.SINHVIEN ([PASSWORD]) TO KHOA;
GO
DENY INSERT, UPDATE, DELETE ON dbo.SINHVIEN TO KHOA;
GO

GRANT SELECT ON dbo.GIANGVIEN (MAGV, HO, TEN, HOCVI, HOCHAM, CHUYENMON, MAKHOA) TO KHOA;
GO
DENY INSERT, UPDATE, DELETE ON dbo.GIANGVIEN TO KHOA;
GO

GRANT SELECT ON dbo.MONHOC (MAMH, TENMH, SOTIET_LT, SOTIET_TH) TO KHOA;
GO
DENY INSERT, UPDATE, DELETE ON dbo.MONHOC TO KHOA;
GO

GRANT SELECT ON dbo.LOPTINCHI (MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP) TO KHOA;
GO
DENY INSERT, UPDATE, DELETE ON dbo.LOPTINCHI TO KHOA;
GO

GRANT SELECT ON dbo.DANGKY (MALTC, MASV, DIEM_CC, DIEM_GK, DIEM_CK, HUYDANGKY) TO KHOA;
GO
DENY INSERT ON dbo.DANGKY TO KHOA;
GO
DENY DELETE ON dbo.DANGKY TO KHOA;
GO
GRANT UPDATE ON dbo.DANGKY (DIEM_CC, DIEM_GK, DIEM_CK) TO KHOA;
GO
DENY UPDATE ON dbo.DANGKY (MALTC, MASV, HUYDANGKY) TO KHOA;
GO

/* PHÂN QUYỀN ROLE SV */

GRANT SELECT ON dbo.KHOA (MAKHOA, TENKHOA) TO SV;
GO
DENY INSERT, UPDATE, DELETE ON dbo.KHOA TO SV;
GO

GRANT SELECT ON dbo.LOP (MALOP, TENLOP, KHOAHOC, MAKHOA) TO SV;
GO
DENY INSERT, UPDATE, DELETE ON dbo.LOP TO SV;
GO

GRANT SELECT ON dbo.SINHVIEN (MASV, HO, TEN, MALOP, PHAI, NGAYSINH, DIACHI) TO SV;
GO
DENY SELECT ON dbo.SINHVIEN (DANGHIHOC, [PASSWORD]) TO SV;
GO
DENY INSERT, UPDATE, DELETE ON dbo.SINHVIEN TO SV;
GO

GRANT SELECT ON dbo.GIANGVIEN (MAGV, HO, TEN, HOCVI, HOCHAM, CHUYENMON, MAKHOA) TO SV;
GO
DENY INSERT, UPDATE, DELETE ON dbo.GIANGVIEN TO SV;
GO

GRANT SELECT ON dbo.MONHOC (MAMH, TENMH, SOTIET_LT, SOTIET_TH) TO SV;
GO
DENY INSERT, UPDATE, DELETE ON dbo.MONHOC TO SV;
GO

GRANT SELECT ON dbo.LOPTINCHI (MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP) TO SV;
GO
DENY INSERT, UPDATE, DELETE ON dbo.LOPTINCHI TO SV;
GO

GRANT SELECT ON dbo.DANGKY (MALTC, MASV, DIEM_CC, DIEM_GK, DIEM_CK, HUYDANGKY) TO SV;
GO
GRANT INSERT ON dbo.DANGKY TO SV;
GO
GRANT UPDATE ON dbo.DANGKY (HUYDANGKY) TO SV;
GO
DENY UPDATE ON dbo.DANGKY (DIEM_CC, DIEM_GK, DIEM_CK) TO SV;
GO
DENY UPDATE ON dbo.DANGKY (MALTC, MASV) TO SV;
GO
DENY DELETE ON dbo.DANGKY TO SV;
GO

-- ==========================================
-- PROCEDURES - SYSTEM AUTH
-- ==========================================

-- =========================================================================
-- STORED PROCEDURE: SP_STUDENT_LOGIN
-- Description: Kiểm tra đăng nhập của Sinh viên. Nếu thành công, trả về
--              thông tin cá nhân gồm Mã SV, Họ, Tên, Mã Lớp và Role.
-- Parameters:
--   - @MaSV: Mã sinh viên đăng nhập
--   - @Password: Mật khẩu sinh viên
-- Returns: Bảng thông tin sinh viên và RoleName 'SV'
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_STUDENT_LOGIN
    @MaSV NVARCHAR(10),
    @Password NVARCHAR(40)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 
        FROM dbo.Sinhvien 
        WHERE MASV = @MaSV AND [PASSWORD] = @Password AND DANGHIHOC = 0
    )
    BEGIN
        SELECT MASV, HO, TEN, MALOP, N'SV' AS [RoleName]
        FROM dbo.Sinhvien
        WHERE MASV = @MaSV;
    END
    ELSE
    BEGIN
        RAISERROR(N'Mã sinh viên hoặc Mật khẩu không đúng, hoặc tài khoản đã bị khóa (Đã nghỉ học)!', 16, 1);
    END
END
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_LOGIN
-- Description: Tạo mới một SQL Server Login trên server cho giảng viên/nhân viên.
-- Parameters:
--   - @LoginName: Tên login cần tạo
--   - @Password: Mật khẩu cho login mới
-- Returns: Không trả về dữ liệu, in thông báo thành công hoặc ném lỗi.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_LOGIN
    @LoginName NVARCHAR(50),
    @Password NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM master.dbo.syslogins WHERE name = @LoginName)
    BEGIN
        RAISERROR(N'Tên Login "%s" đã tồn tại trên Server này rồi!', 16, 1, @LoginName);
        RETURN;
    END

    BEGIN TRY
        DECLARE @CurrentDB NVARCHAR(50) = DB_NAME();
        EXEC master.sys.sp_addlogin @LoginName, @Password, @CurrentDB;
        PRINT N'Xử lý thành công: Đã tạo xong Login "' + @LoginName + N'" trên Server.';
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(N'Lỗi khi tạo Login: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_USER
-- Description: Tạo database user từ SQL Login và gán vào database role tương ứng.
-- Parameters:
--   - @LoginName: Tên login đã có trên Server
--   - @UserName: Mã giảng viên hoặc nhân viên làm DB User tương ứng
--   - @RoleName: Tên nhóm quyền được gán ('PGV', 'KHOA', 'SV')
-- Returns: Không trả về dữ liệu, in thông báo thành công hoặc ném lỗi.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_USER
    @LoginName NVARCHAR(50),
    @UserName NVARCHAR(50),
    @RoleName NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF @RoleName NOT IN ('PGV', 'KHOA', 'SV')
    BEGIN
        RAISERROR(N'Role không hợp lệ! Hệ thống chỉ chấp nhận: PGV, KHOA, hoặc SV.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM master.dbo.syslogins WHERE name = @LoginName)
    BEGIN
        RAISERROR(N'Tên Login "%s" chưa tồn tại trên Server. Hãy tạo Login trước!', 16, 1, @LoginName);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM dbo.sysusers WHERE name = @UserName)
    BEGIN
        RAISERROR(N'Mã người dùng (User) "%s" đã tồn tại trong Database này rồi!', 16, 1, @UserName);
        RETURN;
    END

    BEGIN TRY
        EXEC sp_grantdbaccess @LoginName, @UserName;
        EXEC sp_addrolemember @RoleName, @UserName;
        PRINT N'Xử lý thành công: Link Login và tạo User.';
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(N'Lỗi khi liên kết Login và tạo User: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CHANGE_PASSWORD
-- Description: Thay đổi mật khẩu cho tài khoản.
--              - Nếu là sinh viên: Thay đổi mật khẩu trong bảng Sinhvien.
--              - Nếu là giảng viên/nhân viên: Thay đổi mật khẩu SQL Login của hệ thống.
-- Parameters:
--   - @UserName: Mã sinh viên hoặc mã giảng viên/nhân viên
--   - @OldPassword: Mật khẩu cũ
--   - @NewPassword: Mật khẩu mới cần đổi
--   - @IsStudent: Bit phân biệt sinh viên (1) và giảng viên/PGV (0)
-- Returns: Không trả về dữ liệu, in thông báo thành công hoặc ném lỗi.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CHANGE_PASSWORD
    @UserName NVARCHAR(50),
    @OldPassword NVARCHAR(50),
    @NewPassword NVARCHAR(50),
    @IsStudent BIT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF @IsStudent = 1
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.Sinhvien WHERE MASV = @UserName AND [PASSWORD] = @OldPassword)
            BEGIN
                RAISERROR(N'Mật khẩu cũ của Sinh viên không chính xác!', 16, 1);
                RETURN;
            END

            UPDATE dbo.Sinhvien 
            SET [PASSWORD] = @NewPassword 
            WHERE MASV = @UserName;

            PRINT N'Đổi mật khẩu Sinh viên thành công!';
        END
        ELSE
        BEGIN
            DECLARE @LoginName NVARCHAR(50) = NULL;

            SELECT @LoginName = l.name 
            FROM dbo.sysusers u 
            INNER JOIN master.dbo.syslogins l ON u.sid = l.sid 
            WHERE u.name = @UserName;

            IF @LoginName IS NULL
            BEGIN
                RAISERROR(N'Không tìm thấy tài khoản hệ thống tương ứng với Mã Giảng viên "%s"!', 16, 1, @UserName);
                RETURN;
            END

            EXEC sp_password @old = @OldPassword, @new = @NewPassword, @loginame = @LoginName;
            PRINT N'Đổi mật khẩu SQL Login thành công!';
        END
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(N'Lỗi khi đổi mật khẩu: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_USER_ROLES
-- Description: Lấy danh sách các database roles của một database user cụ thể.
-- Parameters:
--   - @UserName: Tên database user cần lấy vai trò
-- Returns: Bảng danh sách các RoleName của User.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_USER_ROLES
    @UserName NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT r.name AS RoleName
    FROM sys.database_role_members drm
    INNER JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
    INNER JOIN sys.database_principals u ON drm.member_principal_id = u.principal_id
    WHERE u.name = @UserName;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_DB_USER_BY_LOGIN
-- Description: Lấy tên Database User tương ứng với một SQL Server Login Name.
-- Parameters:
--   - @LoginName: Tên SQL Login trên Server
-- Returns: Bảng chứa tên Database User.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_DB_USER_BY_LOGIN
    @LoginName NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT u.name AS UserName 
    FROM sys.database_principals u
    INNER JOIN sys.sql_logins l ON u.sid = l.sid
    WHERE l.name = @LoginName;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DROP_LOGIN_AND_USER
-- Description: Xóa Database User tương ứng và SQL Login của một tài khoản.
-- Parameters:
--   - @LoginName: Tên SQL Login cần xóa
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DROP_LOGIN_AND_USER
    @LoginName NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserName NVARCHAR(128) = NULL;

    -- Tìm DB User tương ứng với Login
    SELECT @UserName = u.name 
    FROM sys.database_principals u
    INNER JOIN sys.sql_logins l ON u.sid = l.sid
    WHERE l.name = @LoginName;

    -- Xóa DB User nếu tồn tại
    IF @UserName IS NOT NULL
    BEGIN
        DECLARE @SqlUser NVARCHAR(256) = N'DROP USER ' + QUOTENAME(@UserName);
        EXEC sp_executesql @SqlUser;
    END

    -- Xóa SQL Login nếu tồn tại
    IF EXISTS (SELECT 1 FROM master.dbo.syslogins WHERE name = @LoginName)
    BEGIN
        DECLARE @SqlLogin NVARCHAR(256) = N'DROP LOGIN ' + QUOTENAME(@LoginName);
        EXEC sp_executesql @SqlLogin;
    END
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_ACCOUNTS
-- Description: Lấy toàn bộ danh sách tài khoản đăng nhập SQL Server và ánh xạ Role, Họ tên.
-- Parameters: Không
-- Returns: Bảng danh sách các tài khoản.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_ACCOUNTS
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        l.name AS USERNAME,
        CASE
            WHEN COALESCE(roles.IsDbOwner, 0) = 1 OR l.name = 'sa' THEN 'PGV'
            WHEN COALESCE(roles.IsDataWriter, 0) = 1 THEN 'KHOA'
            WHEN COALESCE(roles.IsDataReader, 0) = 1 THEN 'SINHVIEN'
            ELSE 'KHOA'
        END AS ROLE,
        CASE
            WHEN gv.MAGV IS NOT NULL THEN
                LTRIM(RTRIM(COALESCE(gv.HO, ''))) +
                CASE
                    WHEN gv.TEN IS NOT NULL AND gv.TEN <> '' THEN ' ' + LTRIM(RTRIM(gv.TEN))
                    ELSE ''
                END
            WHEN l.name = 'sa' THEN N'Quản trị viên (PGV)'
            ELSE COALESCE(u.name, l.name)
        END AS FULLNAME,
        N'Hoạt động' AS STATUS
    FROM sys.sql_logins l
    LEFT JOIN sys.database_principals u
        ON u.sid = l.sid
       AND u.type IN ('S', 'U')
    OUTER APPLY (
        SELECT
            MAX(CASE WHEN r.name = 'db_owner' THEN 1 ELSE 0 END) AS IsDbOwner,
            MAX(CASE WHEN r.name = 'db_datawriter' THEN 1 ELSE 0 END) AS IsDataWriter,
            MAX(CASE WHEN r.name = 'db_datareader' THEN 1 ELSE 0 END) AS IsDataReader
        FROM sys.database_role_members drm
        INNER JOIN sys.database_principals r
            ON drm.role_principal_id = r.principal_id
        WHERE drm.member_principal_id = u.principal_id
    ) roles
    LEFT JOIN GIANGVIEN gv
        ON gv.MAGV = u.name
    WHERE l.name NOT LIKE '##%'
      AND l.name <> 'sa'
      AND l.name <> 'distributor_admin'
      AND l.name NOT LIKE 'NT %'
      AND l.name NOT LIKE 'BUILTIN%'
    ORDER BY l.name;
END;
GO


-- =========================================================================
-- SECTION 02: KHOA MODULE
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_KHOA
-- Description: Lấy toàn bộ danh sách khoa trong hệ thống.
-- Parameters: Không
-- Returns: Bảng chứa các trường MAKHOA, TENKHOA
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_KHOA
AS
BEGIN
    SELECT MAKHOA, TENKHOA 
    FROM KHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_KHOA_BY_ID
-- Description: Lấy thông tin khoa cụ thể theo Mã Khoa.
-- Parameters:
--   - @MAKHOA: Mã khoa cần truy vấn
-- Returns: Dòng thông tin của khoa đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_KHOA_BY_ID
    @MAKHOA NCHAR(10)
AS
BEGIN
    SELECT MAKHOA, TENKHOA 
    FROM KHOA 
    WHERE MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_KHOA
-- Description: Thêm mới một khoa vào hệ thống.
-- Parameters:
--   - @MAKHOA: Mã khoa mới
--   - @TENKHOA: Tên khoa mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_KHOA
    @MAKHOA NCHAR(10),
    @TENKHOA NVARCHAR(50)
AS
BEGIN
    INSERT INTO KHOA (MAKHOA, TENKHOA)
    VALUES (@MAKHOA, @TENKHOA);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_KHOA
-- Description: Cập nhật tên khoa của một khoa đã tồn tại.
-- Parameters:
--   - @MAKHOA: Mã khoa cần chỉnh sửa
--   - @TENKHOA: Tên khoa mới cập nhật
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_KHOA
    @MAKHOA NCHAR(10),
    @TENKHOA NVARCHAR(50)
AS
BEGIN
    UPDATE KHOA
    SET TENKHOA = @TENKHOA
    WHERE MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DELETE_KHOA
-- Description: Xóa một khoa khỏi hệ thống theo Mã Khoa.
-- Parameters:
--   - @MAKHOA: Mã khoa cần xóa
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DELETE_KHOA
    @MAKHOA NCHAR(10)
AS
BEGIN
    DELETE FROM KHOA
    WHERE MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_RESTORE_KHOA
-- Description: Khôi phục khoa đã xóa (Tính năng No-op do cấu trúc bảng không có cờ xóa).
-- Parameters:
--   - @MAKHOA: Mã khoa cần khôi phục
-- Returns: Trả về 1
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_RESTORE_KHOA
    @MAKHOA NCHAR(10)
AS
BEGIN
    SELECT 1;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_SEARCH_KHOA
-- Description: Tìm kiếm khoa theo từ khóa (Mã Khoa hoặc Tên Khoa).
-- Parameters:
--   - @KEYWORD: Từ khóa tìm kiếm
-- Returns: Danh sách khoa thỏa mãn điều kiện.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_SEARCH_KHOA
    @KEYWORD NVARCHAR(100)
AS
BEGIN
    SELECT MAKHOA, TENKHOA
    FROM KHOA
    WHERE MAKHOA LIKE '%' + @KEYWORD + '%' OR TENKHOA LIKE '%' + @KEYWORD + '%';
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOCAL_KHOA
-- Description: Lấy mã khoa và tên khoa cục bộ tương ứng với database hiện tại.
-- Returns: Một dòng chứa MAKHOA và TENKHOA.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOCAL_KHOA
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @DBName NVARCHAR(128) = DB_NAME();
    IF CHARINDEX('HTC', @DBName) > 0 OR @DBName = 'QLDSV_HTC'
    BEGIN
        SELECT MAKHOA, TENKHOA FROM KHOA WHERE MAKHOA = 'CNTT';
    END
    ELSE
    BEGIN
        SELECT MAKHOA, TENKHOA FROM KHOA WHERE MAKHOA = 'VT';
    END
END;
GO



-- =========================================================================
-- SECTION 03: LOP MODULE (INDEXES AND STORED PROCEDURES)
-- =========================================================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LOP_MAKHOA' AND object_id = OBJECT_ID('dbo.LOP'))
BEGIN
    CREATE INDEX IX_LOP_MAKHOA
    ON dbo.LOP (MAKHOA)
    INCLUDE (MALOP, TENLOP, KHOAHOC);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_LOP
-- Description: Lấy toàn bộ danh sách lớp học trong hệ thống.
-- Parameters: Không
-- Returns: Bảng chứa danh sách lớp học.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_LOP
AS
BEGIN
    SELECT MALOP, TENLOP, KHOAHOC, MAKHOA
    FROM LOP;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOP_BY_ID
-- Description: Lấy chi tiết lớp học theo Mã Lớp.
-- Parameters:
--   - @MALOP: Mã lớp học cần truy vấn
-- Returns: Dòng thông tin của lớp đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOP_BY_ID
    @MALOP NCHAR(10)
AS
BEGIN
    SELECT MALOP, TENLOP, KHOAHOC, MAKHOA
    FROM LOP
    WHERE MALOP = @MALOP;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOP_BY_KHOA
-- Description: Lấy danh sách lớp học thuộc một Khoa cụ thể.
-- Parameters:
--   - @MAKHOA: Mã khoa cần lọc lớp
-- Returns: Danh sách lớp học thuộc khoa đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOP_BY_KHOA
    @MAKHOA NCHAR(10)
AS
BEGIN
    SELECT MALOP, TENLOP, KHOAHOC, MAKHOA
    FROM LOP
    WHERE MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_LOP
-- Description: Thêm mới một lớp học.
-- Parameters:
--   - @MALOP: Mã lớp mới
--   - @TENLOP: Tên lớp học
--   - @KHOAHOC: Niên khóa/Khóa học (ví dụ: '2023-2027')
--   - @MAKHOA: Mã khoa quản lý lớp học này
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_LOP
    @MALOP NCHAR(10),
    @TENLOP NVARCHAR(50),
    @KHOAHOC NCHAR(9),
    @MAKHOA NCHAR(10)
AS
BEGIN
    INSERT INTO LOP (MALOP, TENLOP, KHOAHOC, MAKHOA)
    VALUES (@MALOP, @TENLOP, @KHOAHOC, @MAKHOA);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_LOP
-- Description: Cập nhật thông tin lớp học đã có.
-- Parameters:
--   - @MALOP: Mã lớp cần sửa
--   - @TENLOP: Tên lớp học mới
--   - @KHOAHOC: Khóa học mới
--   - @MAKHOA: Mã khoa mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_LOP
    @MALOP NCHAR(10),
    @TENLOP NVARCHAR(50),
    @KHOAHOC NCHAR(9),
    @MAKHOA NCHAR(10)
AS
BEGIN
    UPDATE LOP
    SET TENLOP = @TENLOP,
        KHOAHOC = @KHOAHOC,
        MAKHOA = @MAKHOA
    WHERE MALOP = @MALOP;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DELETE_LOP
-- Description: Xóa một lớp học khỏi hệ thống.
-- Parameters:
--   - @MALOP: Mã lớp cần xóa
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DELETE_LOP
    @MALOP NCHAR(10)
AS
BEGIN
    DELETE FROM LOP
    WHERE MALOP = @MALOP;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_RESTORE_LOP
-- Description: Khôi phục lớp học (Tính năng No-op).
-- Parameters:
--   - @MALOP: Mã lớp cần khôi phục
-- Returns: Trả về 1
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_RESTORE_LOP
    @MALOP NCHAR(10)
AS
BEGIN
    SELECT 1;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_SEARCH_LOP
-- Description: Tìm kiếm lớp học theo Mã Lớp hoặc Tên Lớp.
-- Parameters:
--   - @KEYWORD: Từ khóa tìm kiếm
-- Returns: Danh sách các lớp học thỏa mãn điều kiện.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_SEARCH_LOP
    @KEYWORD NVARCHAR(100)
AS
BEGIN
    SELECT MALOP, TENLOP, KHOAHOC, MAKHOA
    FROM LOP
    WHERE MALOP LIKE '%' + @KEYWORD + '%' OR TENLOP LIKE '%' + @KEYWORD + '%';
END;
GO


-- =========================================================================
-- SECTION 04: SINHVIEN MODULE (INDEXES AND STORED PROCEDURES)
-- =========================================================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SINHVIEN_MALOP' AND object_id = OBJECT_ID('dbo.SINHVIEN'))
BEGIN
    CREATE INDEX IX_SINHVIEN_MALOP
    ON dbo.SINHVIEN (MALOP)
    INCLUDE (MASV, HO, TEN, PHAI, NGAYSINH, DIACHI, DANGHIHOC);
END;
GO

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


-- =========================================================================
-- SECTION 05: GIANGVIEN MODULE (INDEXES AND STORED PROCEDURES)
-- =========================================================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GIANGVIEN_MAKHOA' AND object_id = OBJECT_ID('dbo.GIANGVIEN'))
BEGIN
    CREATE INDEX IX_GIANGVIEN_MAKHOA
    ON dbo.GIANGVIEN (MAKHOA)
    INCLUDE (MAGV, HO, TEN, HOCVI, HOCHAM, CHUYENMON);
END;
GO

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


-- =========================================================================
-- SECTION 06: MONHOC MODULE
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_MONHOC
-- Description: Lấy danh sách toàn bộ môn học trong hệ thống.
-- Parameters: Không
-- Returns: Bảng danh sách các môn học.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_MONHOC
AS
BEGIN
    SELECT MAMH, TENMH, SOTIET_LT, SOTIET_TH
    FROM MONHOC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_MONHOC_BY_ID
-- Description: Lấy thông tin chi tiết môn học theo Mã Môn học.
-- Parameters:
--   - @MAMH: Mã môn học
-- Returns: Dòng thông tin của môn học đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_MONHOC_BY_ID
    @MAMH NCHAR(10)
AS
BEGIN
    SELECT MAMH, TENMH, SOTIET_LT, SOTIET_TH
    FROM MONHOC
    WHERE MAMH = @MAMH;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_MONHOC
-- Description: Thêm mới một môn học vào hệ thống.
-- Parameters:
--   - @MAMH: Mã môn học (Khóa chính)
--   - @TENMH: Tên môn học
--   - @SOTIET_LT: Số tiết lý thuyết
--   - @SOTIET_TH: Số tiết thực hành
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_MONHOC
    @MAMH NCHAR(10),
    @TENMH NVARCHAR(50),
    @SOTIET_LT INT,
    @SOTIET_TH INT
AS
BEGIN
    INSERT INTO MONHOC (MAMH, TENMH, SOTIET_LT, SOTIET_TH)
    VALUES (@MAMH, @TENMH, @SOTIET_LT, @SOTIET_TH);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_MONHOC
-- Description: Cập nhật thông tin của môn học đã tồn tại.
-- Parameters:
--   - @MAMH: Mã môn học cần sửa
--   - @TENMH: Tên môn học mới
--   - @SOTIET_LT: Số tiết lý thuyết mới
--   - @SOTIET_TH: Số tiết thực hành mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_MONHOC
    @MAMH NCHAR(10),
    @TENMH NVARCHAR(50),
    @SOTIET_LT INT,
    @SOTIET_TH INT
AS
BEGIN
    UPDATE MONHOC
    SET TENMH = @TENMH,
        SOTIET_LT = @SOTIET_LT,
        SOTIET_TH = @SOTIET_TH
    WHERE MAMH = @MAMH;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DELETE_MONHOC
-- Description: Xóa môn học khỏi cơ sở dữ liệu theo Mã Môn học.
-- Parameters:
--   - @MAMH: Mã môn học cần xóa
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DELETE_MONHOC
    @MAMH NCHAR(10)
AS
BEGIN
    DELETE FROM MONHOC
    WHERE MAMH = @MAMH;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_RESTORE_MONHOC
-- Description: Khôi phục môn học (Tính năng No-op).
-- Parameters:
--   - @MAMH: Mã môn học
-- Returns: Trả về 1
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_RESTORE_MONHOC
    @MAMH NCHAR(10)
AS
BEGIN
    SELECT 1;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_SEARCH_MONHOC
-- Description: Tìm kiếm môn học theo Mã hoặc Tên môn học.
-- Parameters:
--   - @KEYWORD: Từ khóa tìm kiếm
-- Returns: Danh sách môn học khớp từ khóa.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_SEARCH_MONHOC
    @KEYWORD NVARCHAR(100)
AS
BEGIN
    SELECT MAMH, TENMH, SOTIET_LT, SOTIET_TH
    FROM MONHOC
    WHERE MAMH LIKE '%' + @KEYWORD + '%' OR TENMH LIKE '%' + @KEYWORD + '%';
END;
GO


-- =========================================================================
-- SECTION 07: LOPTINCHI MODULE (INDEXES AND STORED PROCEDURES)
-- =========================================================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LOPTINCHI_MAKHOA' AND object_id = OBJECT_ID('dbo.LOPTINCHI'))
BEGIN
    CREATE INDEX IX_LOPTINCHI_MAKHOA
    ON dbo.LOPTINCHI (MAKHOA)
    INCLUDE (MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAGV, SOSVTOITHIEU, HUYLOP);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LOPTINCHI_MAGV' AND object_id = OBJECT_ID('dbo.LOPTINCHI'))
BEGIN
    CREATE INDEX IX_LOPTINCHI_MAGV
    ON dbo.LOPTINCHI (MAGV)
    INCLUDE (MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAKHOA, SOSVTOITHIEU, HUYLOP);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LOPTINCHI_NIENKHOA_HOCKY' AND object_id = OBJECT_ID('dbo.LOPTINCHI'))
BEGIN
    CREATE INDEX IX_LOPTINCHI_NIENKHOA_HOCKY
    ON dbo.LOPTINCHI (NIENKHOA, HOCKY)
    INCLUDE (MALTC, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_ALL_LOPTINCHI
-- Description: Lấy danh sách toàn bộ các lớp tín chỉ kèm tên Môn học và tên Giảng viên.
-- Parameters: Không
-- Returns: Bảng danh sách lớp tín chỉ xếp theo mã giảm dần.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_ALL_LOPTINCHI
AS
BEGIN
    SELECT 
        ltc.MALTC, 
        ltc.NIENKHOA, 
        ltc.HOCKY, 
        ltc.MAMH, 
        mh.TENMH,
        ltc.NHOM, 
        ltc.MAGV, 
        gv.HO + ' ' + gv.TEN AS TENGV,
        ltc.MAKHOA, 
        ltc.SOSVTOITHIEU, 
        ltc.HUYLOP
    FROM LOPTINCHI ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    ORDER BY ltc.MALTC DESC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOPTINCHI_BY_ID
-- Description: Lấy thông tin lớp tín chỉ cụ thể theo Mã Lớp tín chỉ.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ (Số nguyên tự tăng)
-- Returns: Dòng thông tin của lớp tín chỉ đó.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOPTINCHI_BY_ID
    @MALTC INT
AS
BEGIN
    SELECT MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP
    FROM LOPTINCHI
    WHERE MALTC = @MALTC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOPTINCHI_BY_KHOA
-- Description: Lấy danh sách các lớp tín chỉ thuộc một Khoa.
-- Parameters:
--   - @MAKHOA: Mã khoa cần lọc
-- Returns: Bảng danh sách các lớp tín chỉ của khoa.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOPTINCHI_BY_KHOA
    @MAKHOA NCHAR(10)
AS
BEGIN
    SELECT MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP
    FROM LOPTINCHI
    WHERE MAKHOA = @MAKHOA;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOPTINCHI_BY_NIENKHOA_HOCKY
-- Description: Lấy danh sách các lớp tín chỉ đang hoạt động (HUYLOP = 0)
--              theo Niên khóa và Học kỳ.
-- Parameters:
--   - @NIENKHOA: Niên khóa cần lọc (ví dụ: '2023-2024')
--   - @HOCKY: Học kỳ cần lọc (1, 2, 3)
-- Returns: Bảng danh sách lớp tín chỉ đáp ứng yêu cầu.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOPTINCHI_BY_NIENKHOA_HOCKY
    @NIENKHOA NCHAR(9),
    @HOCKY INT
AS
BEGIN
    SELECT 
        ltc.MALTC, 
        ltc.NIENKHOA, 
        ltc.HOCKY, 
        ltc.MAMH, 
        mh.TENMH,
        ltc.NHOM, 
        ltc.MAGV, 
        gv.HO + ' ' + gv.TEN AS TENGV,
        ltc.MAKHOA, 
        ltc.SOSVTOITHIEU, 
        ltc.HUYLOP
    FROM LOPTINCHI ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    WHERE ltc.NIENKHOA = @NIENKHOA 
      AND ltc.HOCKY = @HOCKY
      AND ltc.HUYLOP = 0;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_LOPTINCHI_BY_GIANGVIEN
-- Description: Lấy danh sách lớp tín chỉ được phân công cho một Giảng viên.
-- Parameters:
--   - @MAGV: Mã giảng viên giảng dạy
-- Returns: Bảng danh sách các lớp tín chỉ.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_LOPTINCHI_BY_GIANGVIEN
    @MAGV NCHAR(10)
AS
BEGIN
    SELECT MALTC, NIENKHOA, HOCKY, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP
    FROM LOPTINCHI
    WHERE MAGV = @MAGV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CREATE_LOPTINCHI
-- Description: Tạo mới một lớp tín chỉ.
-- Parameters:
--   - @NIENKHOA: Niên khóa lớp tín chỉ
--   - @HOCKY: Học kỳ (Số nguyên)
--   - @MAMH: Mã môn học
--   - @NHOM: Số nhóm của lớp môn học này
--   - @MAGV: Mã giảng viên phụ trách
--   - @MAKHOA: Mã khoa
--   - @SOSVTOITHIEU: Số lượng sinh viên tối thiểu để mở lớp
--   - @HUYLOP: Trạng thái hủy lớp (Bit: 1 là hủy, 0 là hoạt động)
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CREATE_LOPTINCHI
    @NIENKHOA NCHAR(9),
    @HOCKY INT,
    @MAMH NCHAR(10),
    @NHOM INT,
    @MAGV NCHAR(10),
    @MAKHOA NCHAR(10),
    @SOSVTOITHIEU INT,
    @HUYLOP BIT
AS
BEGIN
    INSERT INTO LOPTINCHI (NIENKHOA, HOCKY, MAMH, NHOM, MAGV, MAKHOA, SOSVTOITHIEU, HUYLOP)
    VALUES (@NIENKHOA, @HOCKY, @MAMH, @NHOM, @MAGV, @MAKHOA, @SOSVTOITHIEU, @HUYLOP);
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_LOPTINCHI
-- Description: Cập nhật thông tin chi tiết của một lớp tín chỉ đã có.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần cập nhật (Khóa chính)
--   - @NIENKHOA: Niên khóa mới
--   - @HOCKY: Học kỳ mới
--   - @MAMH: Mã môn học mới
--   - @NHOM: Nhóm mới
--   - @MAGV: Mã giảng viên mới
--   - @MAKHOA: Mã khoa mới
--   - @SOSVTOITHIEU: Số sinh viên tối thiểu mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_LOPTINCHI
    @MALTC INT,
    @NIENKHOA NCHAR(9),
    @HOCKY INT,
    @MAMH NCHAR(10),
    @NHOM INT,
    @MAGV NCHAR(10),
    @MAKHOA NCHAR(10),
    @SOSVTOITHIEU INT
AS
BEGIN
    UPDATE LOPTINCHI
    SET NIENKHOA = @NIENKHOA,
        HOCKY = @HOCKY,
        MAMH = @MAMH,
        NHOM = @NHOM,
        MAGV = @MAGV,
        MAKHOA = @MAKHOA,
        SOSVTOITHIEU = @SOSVTOITHIEU
    WHERE MALTC = @MALTC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_DELETE_LOPTINCHI
-- Description: Xóa một lớp tín chỉ khỏi hệ thống.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần xóa
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_DELETE_LOPTINCHI
    @MALTC INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Count INT;
    DECLARE @MinStudents INT;

    -- Lấy số sinh viên tối thiểu của lớp tín chỉ
    SELECT @MinStudents = SOSVTOITHIEU
    FROM LOPTINCHI
    WHERE MALTC = @MALTC;

    -- Nếu lớp tín chỉ không tồn tại, kết thúc
    IF @MinStudents IS NULL
    BEGIN
        RAISERROR(N'Lớp tín chỉ không tồn tại!', 16, 1);
        RETURN;
    END;

    -- Đếm số sinh viên hiện đang đăng ký hoạt động (HUYDANGKY = 0)
    SELECT @Count = COUNT(*)
    FROM DANGKY
    WHERE MALTC = @MALTC AND HUYDANGKY = 0;

    -- Kiểm tra điều kiện: số đăng ký phải bé hơn số tối thiểu
    IF @Count >= @MinStudents
    BEGIN
        RAISERROR(N'Không thể xóa lớp tín chỉ này vì số sinh viên đăng ký (%d) đạt hoặc vượt quá số lượng tối thiểu (%d)!', 16, 1, @Count, @MinStudents);
        RETURN;
    END;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Xóa các đăng ký của lớp tín chỉ trước để tránh lỗi khóa ngoại
        DELETE FROM DANGKY
        WHERE MALTC = @MALTC;

        -- Xóa lớp tín chỉ
        DELETE FROM LOPTINCHI
        WHERE MALTC = @MALTC;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(N'Lỗi khi xóa lớp tín chỉ: %s', 16, 1, @ErrorMessage);
    END CATCH;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_CANCEL_LOPTINCHI
-- Description: Hủy một lớp tín chỉ bằng cách gán trạng thái HUYLOP = 1.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần hủy
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_CANCEL_LOPTINCHI
    @MALTC INT
AS
BEGIN
    UPDATE LOPTINCHI
    SET HUYLOP = 1
    WHERE MALTC = @MALTC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_RESTORE_LOPTINCHI
-- Description: Khôi phục lớp tín chỉ bị hủy (HUYLOP = 0).
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần khôi phục
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_RESTORE_LOPTINCHI
    @MALTC INT
AS
BEGIN
    UPDATE LOPTINCHI
    SET HUYLOP = 0
    WHERE MALTC = @MALTC;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_SEARCH_LOPTINCHI
-- Description: Tìm lớp tín chỉ theo Niên khóa, tên Môn học hoặc tên Giảng viên.
-- Parameters:
--   - @KEYWORD: Từ khóa tìm kiếm
-- Returns: Danh sách các lớp tín chỉ khớp từ khóa.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_SEARCH_LOPTINCHI
    @KEYWORD NVARCHAR(100)
AS
BEGIN
    SELECT ltc.MALTC, ltc.NIENKHOA, ltc.HOCKY, ltc.MAMH, ltc.NHOM, ltc.MAGV, ltc.MAKHOA, ltc.SOSVTOITHIEU, ltc.HUYLOP
    FROM LOPTINCHI ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    WHERE (ltc.NIENKHOA LIKE '%' + @KEYWORD + '%' 
       OR mh.TENMH LIKE '%' + @KEYWORD + '%'
       OR gv.HO + ' ' + gv.TEN LIKE '%' + @KEYWORD + '%');
END;
GO


-- =========================================================================
-- SECTION 08: DANGKY MODULE (INDEXES AND STORED PROCEDURES)
-- =========================================================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DANGKY_MASV' AND object_id = OBJECT_ID('dbo.DANGKY'))
BEGIN
    CREATE INDEX IX_DANGKY_MASV
    ON dbo.DANGKY (MASV)
    INCLUDE (MALTC, DIEM_CC, DIEM_GK, DIEM_CK, HUYDANGKY);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DANGKY_MALTC_HUYDANGKY' AND object_id = OBJECT_ID('dbo.DANGKY'))
BEGIN
    CREATE INDEX IX_DANGKY_MALTC_HUYDANGKY
    ON dbo.DANGKY (MALTC, HUYDANGKY)
    INCLUDE (MASV, DIEM_CC, DIEM_GK, DIEM_CK);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DANGKY_MALTC_SI_SO' AND object_id = OBJECT_ID('dbo.DANGKY'))
BEGIN
    CREATE INDEX IX_DANGKY_MALTC_SI_SO
    ON dbo.DANGKY (MALTC)
    INCLUDE (MASV)
    WHERE HUYDANGKY = 0;
END;
GO

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


-- =========================================================================
-- SECTION 09: DIEM MODULE
-- =========================================================================

-- =========================================================================
-- STORED PROCEDURE: SP_GET_DIEM_BY_LOPTINCHI
-- Description: Lấy danh sách điểm (chuyên cần, giữa kỳ, cuối kỳ) của các
--              sinh viên đăng ký lớp tín chỉ tương ứng.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ cần lấy bảng điểm
-- Returns: Bảng danh sách sinh viên cùng thông tin điểm số.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_DIEM_BY_LOPTINCHI
    @MALTC INT
AS
BEGIN
    SELECT dk.MALTC, dk.MASV, sv.HO, sv.TEN, dk.DIEM_CC, dk.DIEM_GK, dk.DIEM_CK
    FROM DANGKY dk
    INNER JOIN SINHVIEN sv ON dk.MASV = sv.MASV
    WHERE dk.MALTC = @MALTC AND dk.HUYDANGKY = 0;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_GET_DIEM_BY_SINHVIEN
-- Description: Lấy bảng điểm chi tiết các môn học của một sinh viên cụ thể.
-- Parameters:
--   - @MASV: Mã sinh viên cần lấy bảng điểm
-- Returns: Bảng điểm gồm tên môn học, nhóm, và các cột điểm thành phần.
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_GET_DIEM_BY_SINHVIEN
    @MASV NCHAR(10)
AS
BEGIN
    ;WITH FilteredDangKy AS (
        SELECT MALTC, DIEM_CC, DIEM_GK, DIEM_CK
        FROM DANGKY
        WHERE MASV = @MASV AND HUYDANGKY = 0
    )
    SELECT dk.MALTC, ltc.MAMH, mh.TENMH, ltc.NHOM, dk.DIEM_CC, dk.DIEM_GK, dk.DIEM_CK
    FROM FilteredDangKy dk
    INNER JOIN LOPTINCHI ltc ON dk.MALTC = ltc.MALTC
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_DIEM
-- Description: Cập nhật điểm chuyên cần, giữa kỳ, cuối kỳ cho một sinh viên.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ
--   - @MASV: Mã sinh viên
--   - @DIEM_CC: Điểm chuyên cần mới
--   - @DIEM_GK: Điểm giữa kỳ mới
--   - @DIEM_CK: Điểm cuối kỳ mới
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_DIEM
    @MALTC INT,
    @MASV NCHAR(10),
    @DIEM_CC INT,
    @DIEM_GK FLOAT,
    @DIEM_CK FLOAT
AS
BEGIN
    UPDATE DANGKY
    SET DIEM_CC = @DIEM_CC,
        DIEM_GK = @DIEM_GK,
        DIEM_CK = @DIEM_CK
    WHERE MALTC = @MALTC AND MASV = @MASV;
END;
GO

-- =========================================================================
-- STORED PROCEDURE: SP_UPDATE_DIEM_BATCH
-- Description: Cập nhật điểm hàng loạt cho lớp tín chỉ bằng cách giải mã
--              chuỗi JSON truyền vào từ ứng dụng.
-- Parameters:
--   - @MALTC: Mã lớp tín chỉ
--   - @JSON_DATA: Chuỗi dữ liệu JSON chứa danh sách sinh viên và điểm số
-- Returns: Không
-- =========================================================================
CREATE OR ALTER PROCEDURE SP_UPDATE_DIEM_BATCH
    @MALTC INT,
    @JSON_DATA NVARCHAR(MAX)
AS
BEGIN
    UPDATE dk
    SET dk.DIEM_CC = jd.DIEM_CC,
        dk.DIEM_GK = jd.DIEM_GK,
        dk.DIEM_CK = jd.DIEM_CK
    FROM DANGKY dk
    INNER JOIN OPENJSON(@JSON_DATA)
    WITH (
        MASV NCHAR(10) '$.MASV',
        DIEM_CC INT '$.DIEM_CC',
        DIEM_GK FLOAT '$.DIEM_GK',
        DIEM_CK FLOAT '$.DIEM_CK'
    ) jd ON dk.MASV = jd.MASV
    WHERE dk.MALTC = @MALTC AND dk.HUYDANGKY = 0;
END;
GO


-- =========================================================================
-- SECTION 10: REPORT MODULE
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
    ;WITH FilteredDangKy AS (
        SELECT MALTC, DIEM_CC, DIEM_GK, DIEM_CK
        FROM DANGKY
        WHERE MASV = @MASV AND (HUYDANGKY = 0 OR HUYDANGKY IS NULL)
    ),
    ScoreBySubject AS (
        SELECT
            mh.MAMH,
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
                PARTITION BY mh.MAMH 
                ORDER BY 
                    CASE WHEN dk.DIEM_CK IS NULL THEN 0 ELSE 1 END DESC,
                    CASE 
                        WHEN dk.DIEM_CK IS NULL THEN NULL
                        ELSE ISNULL(dk.DIEM_CC, 0) * 0.1 + ISNULL(dk.DIEM_GK, 0) * 0.3 + dk.DIEM_CK * 0.6
                    END DESC,
                    ltc.NIENKHOA DESC,
                    ltc.HOCKY DESC
            ) AS rn
        FROM FilteredDangKy dk
        INNER JOIN LOPTINCHI ltc ON dk.MALTC = ltc.MALTC
        INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY TENMH) AS STT,
        TENMH,
        DIEM_CC,
        DIEM_GK,
        DIEM_CK,
        DIEM,
        NIENKHOA,
        HOCKY
    FROM ScoreBySubject
    WHERE rn = 1
    ORDER BY TENMH;
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

    CREATE NONCLUSTERED INDEX IX_DiemRaw_TENMH ON #DiemRaw (TENMH) INCLUDE (MASV, HO, TEN, DIEM_KTHP);

    DECLARE @cols AS NVARCHAR(MAX),
            @query AS NVARCHAR(MAX);

    SELECT @cols = COALESCE(@cols + ', ', '') + QUOTENAME(TENMH)
    FROM (SELECT DISTINCT TENMH FROM #DiemRaw WHERE TENMH IS NOT NULL) AS Subjects;

    IF @cols IS NULL OR @cols = ''
    BEGIN
        SELECT DISTINCT MASV, HO, TEN 
        FROM SINHVIEN 
        WHERE MALOP = @MALOP;
        DROP TABLE #DiemRaw;
        RETURN;
    END

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
    SET NOCOUNT ON;

    SELECT 
        dk_sub.MALTC, 
        COUNT(dk_sub.MASV) AS SOSV_DANGKY
    INTO #ThongKeDangKy
    FROM DANGKY dk_sub
    WHERE dk_sub.HUYDANGKY = 0 OR dk_sub.HUYDANGKY IS NULL
    GROUP BY dk_sub.MALTC;

    CREATE CLUSTERED INDEX IX_Temp_ThongKeDangKy_MALTC ON #ThongKeDangKy(MALTC);

    SELECT 
        ltc.MALTC,
        mh.TENMH,
        ltc.NHOM,
        gv.HO + ' ' + gv.TEN AS HOTEN_GV,
        ltc.SOSVTOITHIEU,
        ISNULL(tk.SOSV_DANGKY, 0) AS SOSV_DANGKY,
        k.TENKHOA,
        ltc.NIENKHOA,
        ltc.HOCKY
    FROM LOPTINCHI ltc
    INNER JOIN MONHOC mh ON ltc.MAMH = mh.MAMH
    INNER JOIN GIANGVIEN gv ON ltc.MAGV = gv.MAGV
    INNER JOIN KHOA k ON ltc.MAKHOA = k.MAKHOA
    LEFT JOIN #ThongKeDangKy tk ON ltc.MALTC = tk.MALTC
    WHERE ltc.NIENKHOA = @NIENKHOA 
      AND ltc.HOCKY = @HOCKY 
      AND ltc.HUYLOP = 0
    ORDER BY mh.TENMH, ltc.NHOM;

    DROP TABLE #ThongKeDangKy;
END;
GO


-- =========================================================================
-- SECTION 11: DASHBOARD MODULE
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
    SELECT MAKHOA, TENKHOA FROM KHOA;
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
    SELECT MALTC, MAMH, NHOM, MAGV, SOSVTOITHIEU, HUYLOP
    INTO #FilteredLopTinChi
    FROM LOPTINCHI
    WHERE (@MAKHOA IS NULL OR MAKHOA = @MAKHOA)
      AND (@NIENKHOA IS NULL OR NIENKHOA = @NIENKHOA)
      AND (@HOCKY IS NULL OR HOCKY = @HOCKY);

    ALTER TABLE #FilteredLopTinChi ADD CONSTRAINT PK_FilteredLTC PRIMARY KEY CLUSTERED (MALTC);

    SELECT fltc.MALTC, COUNT(dk.MASV) AS SOSVDANGKY
    INTO #DangKyCount
    FROM #FilteredLopTinChi fltc
    LEFT JOIN DANGKY dk ON dk.MALTC = fltc.MALTC AND dk.HUYDANGKY = 0
    GROUP BY fltc.MALTC;

    ALTER TABLE #DangKyCount ADD CONSTRAINT PK_DKCount PRIMARY KEY CLUSTERED (MALTC);

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
