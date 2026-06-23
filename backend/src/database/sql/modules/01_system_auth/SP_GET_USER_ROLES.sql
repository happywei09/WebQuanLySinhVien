USE [QLDSV_HTC];
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
