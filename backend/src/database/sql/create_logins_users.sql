-- =========================================================================
-- SQL SERVER LOGIN & USER MANAGEMENT SCRIPTS
-- Database: QLDSV_HTC
-- Purpose: Create server-level logins and database-level users
-- =========================================================================
-- Notes:
-- - LOGINs are created at the SERVER level (in master database)
-- - USERs are created at the DATABASE level and mapped to LOGINs
-- - This script demonstrates best practices for SQL Server security
-- =========================================================================

-- ===================================
-- PART 1: CREATE SERVER-LEVEL LOGINS
-- ===================================
-- These logins are created at the SQL Server instance level

-- 1.1 Create login for PGV (admin) with strong password
-- WARNING: Replace 'YourStrongPassword123!' with a real strong password
IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'pgv_admin')
BEGIN
    CREATE LOGIN pgv_admin WITH PASSWORD = 'YourStrongPassword123!';
    PRINT 'Login pgv_admin created successfully';
END
ELSE
BEGIN
    PRINT 'Login pgv_admin already exists';
END
GO

-- 1.2 Create login for KHOA (department head)
IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'khoa_cntt')
BEGIN
    CREATE LOGIN khoa_cntt WITH PASSWORD = 'KhoaPassword456!';
    PRINT 'Login khoa_cntt created successfully';
END
ELSE
BEGIN
    PRINT 'Login khoa_cntt already exists';
END
GO

-- 1.3 Create login for SINHVIEN (student) - shared login for all students
IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'sinhvien')
BEGIN
    CREATE LOGIN sinhvien WITH PASSWORD = 'SinhVienPassword789!';
    PRINT 'Login sinhvien created successfully';
END
ELSE
BEGIN
    PRINT 'Login sinhvien already exists';
END
GO

-- ===================================
-- PART 2: CREATE DATABASE-LEVEL USERS
-- ===================================
-- Switch to the target database
USE [QLDSV_HTC];
GO

-- 2.1 Create database user for pgv_admin
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'pgv_admin' AND type = 'S')
BEGIN
    CREATE USER pgv_admin FOR LOGIN pgv_admin;
    PRINT 'Database user pgv_admin created successfully';
END
ELSE
BEGIN
    PRINT 'Database user pgv_admin already exists';
END
GO

-- 2.2 Create database user for khoa_cntt
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'khoa_cntt' AND type = 'S')
BEGIN
    CREATE USER khoa_cntt FOR LOGIN khoa_cntt;
    PRINT 'Database user khoa_cntt created successfully';
END
ELSE
BEGIN
    PRINT 'Database user khoa_cntt already exists';
END
GO

-- 2.3 Create database user for sinhvien
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'sinhvien' AND type = 'S')
BEGIN
    CREATE USER sinhvien FOR LOGIN sinhvien;
    PRINT 'Database user sinhvien created successfully';
END
ELSE
BEGIN
    PRINT 'Database user sinhvien already exists';
END
GO

-- ===================================
-- PART 3: ASSIGN DATABASE ROLES & PERMISSIONS
-- ===================================

-- 3.1 Assign pgv_admin to db_owner role (full permissions)
IF NOT EXISTS (SELECT * FROM sys.database_role_members 
               WHERE member_principal_id = (SELECT principal_id FROM sys.database_principals WHERE name = 'pgv_admin')
               AND role_principal_id = (SELECT principal_id FROM sys.database_principals WHERE name = 'db_owner'))
BEGIN
    ALTER ROLE db_owner ADD MEMBER pgv_admin;
    PRINT 'pgv_admin assigned to db_owner role';
END
GO

-- 3.2 Assign khoa_cntt to db_datawriter and db_datareader (read/write data)
IF NOT EXISTS (SELECT * FROM sys.database_role_members 
               WHERE member_principal_id = (SELECT principal_id FROM sys.database_principals WHERE name = 'khoa_cntt')
               AND role_principal_id = (SELECT principal_id FROM sys.database_principals WHERE name = 'db_datawriter'))
BEGIN
    ALTER ROLE db_datawriter ADD MEMBER khoa_cntt;
    ALTER ROLE db_datareader ADD MEMBER khoa_cntt;
    PRINT 'khoa_cntt assigned to db_datawriter and db_datareader roles';
END
GO

-- 3.3 Assign sinhvien to db_datareader only (read-only access)
IF NOT EXISTS (SELECT * FROM sys.database_role_members 
               WHERE member_principal_id = (SELECT principal_id FROM sys.database_principals WHERE name = 'sinhvien')
               AND role_principal_id = (SELECT principal_id FROM sys.database_principals WHERE name = 'db_datareader'))
BEGIN
    ALTER ROLE db_datareader ADD MEMBER sinhvien;
    PRINT 'sinhvien assigned to db_datareader role (read-only)';
END
GO

-- ===================================
-- PART 4: GRANT OBJECT-LEVEL PERMISSIONS (Optional - More Granular Control)
-- ===================================

-- 4.1 Grant EXECUTE permission on stored procedures for khoa_cntt
GRANT EXECUTE ON OBJECT::SP_CREATE_DANGKY TO khoa_cntt;
GRANT EXECUTE ON OBJECT::SP_GET_DIEM_BY_LOPTINCHI TO khoa_cntt;
GRANT EXECUTE ON OBJECT::SP_UPDATE_DIEM TO khoa_cntt;
PRINT 'Stored procedure permissions granted to khoa_cntt';
GO

-- 4.2 Grant SELECT on tables for sinhvien (read-only specific data)
GRANT SELECT ON OBJECT::SINHVIEN TO sinhvien;
GRANT SELECT ON OBJECT::DANGKY TO sinhvien;
GRANT SELECT ON OBJECT::LOPTINCHI TO sinhvien;
GRANT SELECT ON OBJECT::MONHOC TO sinhvien;
PRINT 'SELECT permissions granted to sinhvien on core tables';
GO

-- ===================================
-- PART 5: RETRIEVE LOGIN & USER INFORMATION
-- ===================================

-- 5.1 Get all server-level logins (Run in master database)
PRINT '======= SERVER-LEVEL LOGINS =======';
USE master;
GO

SELECT 
    name AS LoginName,
    principal_id AS PrincipalID,
    type_desc AS LoginType,
    default_database_name AS DefaultDatabase,
    create_date AS CreatedDate,
    modify_date AS ModifiedDate
FROM sys.sql_logins
WHERE name NOT LIKE '%##%'  -- Exclude system logins
ORDER BY name;
GO

-- 5.2 Get all database-level users in QLDSV_HTC (Run in the target database)
PRINT '======= DATABASE-LEVEL USERS IN QLDSV_HTC =======';
USE [QLDSV_HTC];
GO

SELECT 
    u.name AS UserName,
    u.principal_id AS PrincipalID,
    u.type_desc AS UserType,
    l.name AS LoginName,
    u.create_date AS CreatedDate,
    u.modify_date AS ModifiedDate
FROM sys.database_principals u
LEFT JOIN sys.sql_logins l ON u.sid = l.sid
WHERE u.type IN ('S', 'U')  -- SQL logins and Windows users
  AND u.name NOT IN ('dbo', 'public')  -- Exclude default principals
ORDER BY u.name;
GO

-- 5.3 Get database roles and their members
PRINT '======= DATABASE ROLES & MEMBERS =======';
SELECT 
    r.name AS RoleName,
    m.name AS MemberName,
    m.type_desc AS MemberType
FROM sys.database_principals r
INNER JOIN sys.database_role_members drm ON r.principal_id = drm.role_principal_id
INNER JOIN sys.database_principals m ON drm.member_principal_id = m.principal_id
ORDER BY r.name, m.name;
GO

-- 5.4 Get permissions granted to users on specific objects
PRINT '======= USER OBJECT PERMISSIONS =======';
SELECT 
    u.name AS UserName,
    p.permission_name AS Permission,
    p.state_desc AS PermissionState,
    o.name AS ObjectName,
    o.type_desc AS ObjectType
FROM sys.database_principals u
INNER JOIN sys.database_permissions p ON u.principal_id = p.grantee_principal_id
INNER JOIN sys.objects o ON p.major_id = o.object_id
ORDER BY u.name, p.permission_name;
GO

-- ===================================
-- PART 6: VERIFY LOGIN CONNECTION (Test Script)
-- ===================================
-- Use this section to test if logins can connect properly

/*
-- Test connection as pgv_admin (run this in a separate session):
-- In SQL Server Management Studio, use "Connect" dialog and change authentication to "SQL Server Authentication"
-- Enter Login: pgv_admin
-- Enter Password: YourStrongPassword123!
-- 
-- Then run this query to verify you're logged in:
SELECT CURRENT_USER AS CurrentUser, 
       SYSTEM_USER AS SystemUser,
       @@SERVERNAME AS ServerName;

-- Test what this user can access:
USE [QLDSV_HTC];
SELECT * FROM SINHVIEN;  -- Should be accessible as db_owner
SELECT * FROM DANGKY;    -- Should be accessible as db_owner
*/

-- ===================================
-- PART 7: STORED PROCEDURES FOR LOGIN MANAGEMENT
-- ===================================

USE [QLDSV_HTC];
GO

-- 7.1 SP to get login info (query server logins)
CREATE OR ALTER PROCEDURE SP_GET_SERVER_LOGINS
AS
BEGIN
    USE master;
    SELECT 
        name AS LoginName,
        type_desc AS LoginType,
        default_database_name AS DefaultDatabase,
        create_date AS CreatedDate
    FROM sys.sql_logins
    WHERE name NOT LIKE '%##%'
    ORDER BY name;
END;
GO

-- 7.2 SP to get database users
CREATE OR ALTER PROCEDURE SP_GET_DATABASE_USERS
AS
BEGIN
    SELECT 
        u.name AS UserName,
        u.type_desc AS UserType,
        l.name AS LinkedLogin,
        u.create_date AS CreatedDate
    FROM sys.database_principals u
    LEFT JOIN sys.sql_logins l ON u.sid = l.sid
    WHERE u.type IN ('S', 'U')
      AND u.name NOT IN ('dbo', 'public', 'guest')
    ORDER BY u.name;
END;
GO

-- 7.3 SP to get user roles
CREATE OR ALTER PROCEDURE SP_GET_USER_ROLES
    @UserName NVARCHAR(128)
AS
BEGIN
    SELECT 
        u.name AS UserName,
        r.name AS RoleName,
        r.principal_id AS RolePrincipalID
    FROM sys.database_principals u
    INNER JOIN sys.database_role_members drm ON u.principal_id = drm.member_principal_id
    INNER JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
    WHERE u.name = @UserName;
END;
GO

-- 7.4 SP to get object permissions for a user
CREATE OR ALTER PROCEDURE SP_GET_USER_PERMISSIONS
    @UserName NVARCHAR(128)
AS
BEGIN
    SELECT 
        u.name AS UserName,
        p.permission_name AS Permission,
        p.state_desc AS PermissionState,
        o.name AS ObjectName,
        o.type_desc AS ObjectType
    FROM sys.database_principals u
    INNER JOIN sys.database_permissions p ON u.principal_id = p.grantee_principal_id
    LEFT JOIN sys.objects o ON p.major_id = o.object_id
    WHERE u.name = @UserName
    ORDER BY o.name, p.permission_name;
END;
GO

-- ===================================
-- PART 8: DISABLE/ENABLE LOGIN
-- ===================================

-- Disable a login (prevent login)
-- ALTER LOGIN pgv_admin DISABLE;

-- Enable a login
-- ALTER LOGIN pgv_admin ENABLE;

-- Change login password
-- ALTER LOGIN pgv_admin WITH PASSWORD = 'NewPassword123!';

-- Drop a login (must drop associated database users first)
-- DROP USER pgv_admin;  -- In database
-- DROP LOGIN pgv_admin; -- At server level

-- ===================================
-- PART 9: CLEANUP (Optional - Comment out unless needed)
-- ===================================

/*
-- WARNING: This will remove all created logins and users
-- Uncomment only if you need to clean up

USE [QLDSV_HTC];
GO

DROP USER IF EXISTS sinhvien;
DROP USER IF EXISTS khoa_cntt;
DROP USER IF EXISTS pgv_admin;

GO
USE master;
GO

DROP LOGIN IF EXISTS sinhvien;
DROP LOGIN IF EXISTS khoa_cntt;
DROP LOGIN IF EXISTS pgv_admin;

*/

-- ===================================
-- PART 5A: CREATE ACCOUNTS TABLE
-- ===================================
-- Table to store account information (audit log)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ACCOUNTS')
BEGIN
    CREATE TABLE ACCOUNTS (
        ACCOUNT_ID INT PRIMARY KEY IDENTITY(1,1),
        USERNAME NVARCHAR(128) UNIQUE NOT NULL,
        FULLNAME NVARCHAR(255) NOT NULL,
        ROLE NVARCHAR(50) NOT NULL,
        CREATED_DATE DATETIME DEFAULT GETDATE(),
        IS_ACTIVE BIT DEFAULT 1
    );
    PRINT 'Table ACCOUNTS created successfully';
END
ELSE
BEGIN
    PRINT 'Table ACCOUNTS already exists';
END
GO

-- ===================================
-- PART 5B: CREATE ACCOUNT WITH ROLE STORED PROCEDURE
-- ===================================
-- Purpose: Create login, user, and assign role in one procedure
-- Parameters:
--   @FullName: Họ và tên
--   @Username: Tên tài khoản
--   @Password: Mật khẩu
--   @Role: Role (PGV, KHOA, or SV)
-- Returns: Success/Error message

IF OBJECT_ID('SP_CREATE_ACCOUNT_WITH_ROLE', 'P') IS NOT NULL
    DROP PROCEDURE SP_CREATE_ACCOUNT_WITH_ROLE;
GO

CREATE PROCEDURE SP_CREATE_ACCOUNT_WITH_ROLE
    @FullName NVARCHAR(255),
    @Username NVARCHAR(128),
    @Password NVARCHAR(128),
    @Role NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(500);
    DECLARE @QuotedUsername NVARCHAR(130);
    DECLARE @SQL NVARCHAR(MAX);
    
    BEGIN TRY
        -- 1. Validate input parameters
        IF @FullName IS NULL OR LEN(@FullName) = 0
        BEGIN
            SET @ErrorMessage = 'Lỗi: Họ và tên không được để trống';
            RAISERROR(@ErrorMessage, 16, 1);
        END
        
        IF @Username IS NULL OR LEN(@Username) = 0
        BEGIN
            SET @ErrorMessage = 'Lỗi: Tên tài khoản không được để trống';
            RAISERROR(@ErrorMessage, 16, 1);
        END
        
        IF @Password IS NULL OR LEN(@Password) < 8
        BEGIN
            SET @ErrorMessage = 'Lỗi: Mật khẩu phải có ít nhất 8 ký tự';
            RAISERROR(@ErrorMessage, 16, 1);
        END
        
        IF @Role NOT IN ('PGV', 'KHOA', 'SV')
        BEGIN
            SET @ErrorMessage = 'Lỗi: Role phải là PGV, KHOA hoặc SV';
            RAISERROR(@ErrorMessage, 16, 1);
        END
        
        -- 2. Check if username already exists in SQL Server logins
        IF EXISTS (SELECT * FROM sys.sql_logins WHERE name = @Username)
        BEGIN
            SET @ErrorMessage = 'Lỗi: Tài khoản ''' + @Username + ''' đã tồn tại';
            RAISERROR(@ErrorMessage, 16, 1);
        END
        
        -- 3. Check if username already exists in database
        IF EXISTS (SELECT * FROM sys.database_principals WHERE name = @Username)
        BEGIN
            SET @ErrorMessage = 'Lỗi: Người dùng ''' + @Username + ''' đã tồn tại trong database';
            RAISERROR(@ErrorMessage, 16, 1);
        END
        
        -- 4. Create LOGIN at server level
        SET @SQL = 'CREATE LOGIN [' + @Username + '] WITH PASSWORD = ''' + @Password + '''';
        EXEC sp_executesql @SQL;
        PRINT 'Thành công: Tạo login ' + @Username;
        
        -- 5. Create USER at database level
        SET @SQL = 'CREATE USER [' + @Username + '] FOR LOGIN [' + @Username + ']';
        EXEC sp_executesql @SQL;
        PRINT 'Thành công: Tạo user ' + @Username;
        
        -- 6. Assign role based on @Role parameter
        IF @Role = 'PGV'
        BEGIN
            SET @SQL = 'ALTER ROLE db_owner ADD MEMBER [' + @Username + ']';
            EXEC sp_executesql @SQL;
            PRINT 'Thành công: Gán role db_owner cho ' + @Username;
        END
        ELSE IF @Role = 'KHOA'
        BEGIN
            SET @SQL = 'ALTER ROLE db_datawriter ADD MEMBER [' + @Username + ']';
            EXEC sp_executesql @SQL;
            SET @SQL = 'ALTER ROLE db_datareader ADD MEMBER [' + @Username + ']';
            EXEC sp_executesql @SQL;
            PRINT 'Thành công: Gán role db_datawriter, db_datareader cho ' + @Username;
        END
        ELSE IF @Role = 'SV'
        BEGIN
            SET @SQL = 'ALTER ROLE db_datareader ADD MEMBER [' + @Username + ']';
            EXEC sp_executesql @SQL;
            PRINT 'Thành công: Gán role db_datareader cho ' + @Username;
        END
        
        -- 7. Insert into ACCOUNTS table for audit log
        INSERT INTO ACCOUNTS (USERNAME, FULLNAME, ROLE, CREATED_DATE, IS_ACTIVE)
        VALUES (@Username, @FullName, @Role, GETDATE(), 1);
        PRINT 'Thành công: Ghi nhận tài khoản ' + @Username + ' trong hệ thống';
        
        -- 8. Return success message
        PRINT '=====================================';
        PRINT 'TẠO TÀI KHOẢN THÀNH CÔNG';
        PRINT '=====================================';
        PRINT 'Họ và tên: ' + @FullName;
        PRINT 'Tên tài khoản: ' + @Username;
        PRINT 'Role: ' + @Role;
        PRINT '=====================================';
        
    END TRY
    BEGIN CATCH
        -- Error handling
        DECLARE @ErrorNumber INT = ERROR_NUMBER();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        DECLARE @ErrorLine INT = ERROR_LINE();
        DECLARE @ErrorMsg NVARCHAR(MAX) = ERROR_MESSAGE();
        
        PRINT 'LỖI: ' + @ErrorMsg;
        PRINT 'Dòng lỗi: ' + CAST(@ErrorLine AS NVARCHAR(10));
        
        -- Re-raise the error
        RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

PRINT 'Stored Procedure SP_CREATE_ACCOUNT_WITH_ROLE created successfully';

-- ===================================
-- PART 5C: VIEW ACCOUNTS STORED PROCEDURE
-- ===================================
IF OBJECT_ID('SP_VIEW_ACCOUNTS', 'P') IS NOT NULL
    DROP PROCEDURE SP_VIEW_ACCOUNTS;
GO

CREATE PROCEDURE SP_VIEW_ACCOUNTS
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ACCOUNT_ID,
        USERNAME,
        FULLNAME,
        ROLE,
        CREATED_DATE,
        CASE WHEN IS_ACTIVE = 1 THEN 'Hoạt động' ELSE 'Vô hiệu hóa' END AS STATUS
    FROM ACCOUNTS
    ORDER BY CREATED_DATE DESC;
END
GO

PRINT 'Stored Procedure SP_VIEW_ACCOUNTS created successfully';

-- ===================================
-- EXECUTION EXAMPLES
-- ===================================

PRINT '========================================';
PRINT 'Script execution completed successfully';
PRINT '========================================';

-- ===================================
-- HOW TO USE THE NEW SP
-- ===================================
-- Example 1: Create PGV account (admin with db_owner role)
-- EXEC SP_CREATE_ACCOUNT_WITH_ROLE 
--     @FullName = N'Nguyễn Văn A',
--     @Username = 'nguyenvana',
--     @Password = 'Password123456',
--     @Role = 'PGV';

-- Example 2: Create KHOA account (department head with read/write)
-- EXEC SP_CREATE_ACCOUNT_WITH_ROLE 
--     @FullName = N'Trần Thị B',
--     @Username = 'tranthib',
--     @Password = 'Password654321',
--     @Role = 'KHOA';

-- Example 3: Create SV account (student with read-only)
-- EXEC SP_CREATE_ACCOUNT_WITH_ROLE 
--     @FullName = N'Lê Văn C',
--     @Username = 'levanc',
--     @Password = 'Password789012',
--     @Role = 'SV';

-- View all accounts
-- EXEC SP_VIEW_ACCOUNTS;

-- Test the SPs:
-- EXEC SP_GET_SERVER_LOGINS;
-- EXEC SP_GET_DATABASE_USERS;
-- EXEC SP_GET_USER_ROLES @UserName = 'pgv_admin';
-- EXEC SP_GET_USER_PERMISSIONS @UserName = 'khoa_cntt';
