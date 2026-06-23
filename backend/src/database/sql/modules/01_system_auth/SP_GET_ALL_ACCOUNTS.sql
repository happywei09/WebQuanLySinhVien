USE [QLDSV_HTC];
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
