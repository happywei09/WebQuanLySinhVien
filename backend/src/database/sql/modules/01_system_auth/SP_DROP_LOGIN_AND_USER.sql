USE [QLDSV_HTC];
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
        EXEC sp_dropuser @UserName;
    END

    -- Xóa SQL Login nếu tồn tại
    IF EXISTS (SELECT 1 FROM master.dbo.syslogins WHERE name = @LoginName)
    BEGIN
        EXEC sp_droplogin @LoginName
    END
END;
GO
