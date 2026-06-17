// ====================================
// REPOSITORY - ACCOUNT
// ====================================

const { executeStoredProcedure, getPool, sql } = require("../database/connection");

class AccountRepository {
  async getAll() {
    const pool = getPool();
    const result = await pool.request().query(`
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
    `);

    return result.recordset || [];
  }

  async create(data) {
    const normalizedRole = data.role === "SINHVIEN" ? "SV" : data.role;

    await executeStoredProcedure("SP_CREATE_LOGIN", {
      LoginName: { type: sql.NVarChar(50), value: data.username },
      Password: { type: sql.NVarChar(50), value: data.password },
    });

    return executeStoredProcedure("SP_CREATE_USER", {
      LoginName: { type: sql.NVarChar(50), value: data.username },
      UserName: { type: sql.NVarChar(50), value: data.maNV },
      RoleName: { type: sql.NVarChar(20), value: normalizedRole },
    });
  }

  async delete(username) {
    const pool = getPool();

    const userResult = await pool.request()
      .input("username", sql.NVarChar(128), username)
      .query(`
        SELECT u.name AS UserName
        FROM sys.database_principals u
        INNER JOIN sys.sql_logins l ON u.sid = l.sid
        WHERE l.name = @username;
      `);

    const dbUser = userResult.recordset.length > 0 ? userResult.recordset[0].UserName : null;

    if (dbUser) {
      await pool.request().query(`DROP USER [${dbUser}]`);
    }

    await pool.request().query(`DROP LOGIN [${username}]`);

    return { success: true };
  }

  async getNhanVien(maKhoa = null) {
    let result;

    if (maKhoa && maKhoa !== "ALL") {
      result = await executeStoredProcedure("SP_GET_GIANGVIEN_BY_KHOA", {
        MAKHOA: { type: sql.NChar(10), value: maKhoa }
      });
    } else {
      result = await executeStoredProcedure("SP_GET_ALL_GIANGVIEN");
    }

    return result.recordset;
  }
}

module.exports = new AccountRepository();
