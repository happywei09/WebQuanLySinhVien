USE [QLDSV_HTC];
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
