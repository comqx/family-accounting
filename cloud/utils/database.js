const { getConnection } = require('../config/database');

class DatabaseUtils {
  // 执行查询
  static async query(sql, params = []) {
    try {
      const connection = await getConnection();
      const [rows] = await connection.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // 执行单行查询
  static async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  // 执行插入
  static async insert(table, data) {
    try {
      const connection = await getConnection();
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');
      
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      const [result] = await connection.execute(sql, values);
      
      return result.insertId;
    } catch (error) {
      console.error('Database insert error:', error);
      throw error;
    }
  }

  // 执行更新
  static async update(table, data, where, whereParams = []) {
    try {
      const connection = await getConnection();
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), ...whereParams];
      
      const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
      const [result] = await connection.execute(sql, values);
      
      return result.affectedRows;
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  }

  // 执行删除
  static async delete(table, where, params = []) {
    try {
      const connection = await getConnection();
      const sql = `DELETE FROM ${table} WHERE ${where}`;
      const [result] = await connection.execute(sql, params);
      
      return result.affectedRows;
    } catch (error) {
      console.error('Database delete error:', error);
      throw error;
    }
  }

  // 分页查询
  static async paginate(sql, params = [], page = 1, pageSize = 20) {
    try {
      const connection = await getConnection();
      
      // 获取总数
      const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
      const countSqlClean = countSql.replace(/ORDER BY .*/, '').replace(/LIMIT .*/, '');
      const [countResult] = await connection.execute(countSqlClean, params);
      const total = countResult[0].total;
      
      // 获取分页数据
      const offset = (page - 1) * pageSize;
      const dataSql = `${sql} LIMIT ${pageSize} OFFSET ${offset}`;
      const [rows] = await connection.execute(dataSql, params);
      
      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('Database paginate error:', error);
      throw error;
    }
  }

  // 事务执行
  static async transaction(callback) {
    const connection = await getConnection();
    const conn = await connection.getConnection();
    
    try {
      await conn.beginTransaction();
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // 批量插入
  static async batchInsert(table, dataArray) {
    if (dataArray.length === 0) return [];
    
    try {
      const connection = await getConnection();
      const columns = Object.keys(dataArray[0]);
      const placeholders = columns.map(() => '?').join(', ');
      
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      const values = dataArray.map(data => Object.values(data));
      
      const [result] = await connection.execute(sql, values);
      return result.insertId;
    } catch (error) {
      console.error('Database batch insert error:', error);
      throw error;
    }
  }

  // 检查记录是否存在
  static async exists(table, where, params = []) {
    try {
      const sql = `SELECT 1 FROM ${table} WHERE ${where} LIMIT 1`;
      const rows = await this.query(sql, params);
      return rows.length > 0;
    } catch (error) {
      console.error('Database exists check error:', error);
      throw error;
    }
  }

  // 获取记录数量
  static async count(table, where = '1=1', params = []) {
    try {
      const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`;
      const result = await this.queryOne(sql, params);
      return result ? result.count : 0;
    } catch (error) {
      console.error('Database count error:', error);
      throw error;
    }
  }

  // 软删除（更新状态字段）
  static async softDelete(table, id, statusField = 'status', statusValue = 'INACTIVE') {
    return await this.update(table, { [statusField]: statusValue }, 'id = ?', [id]);
  }

  // 获取系统配置
  static async getConfig(key, defaultValue = null) {
    try {
      const sql = 'SELECT config_value FROM system_configs WHERE config_key = ?';
      const result = await this.queryOne(sql, [key]);
      return result ? result.config_value : defaultValue;
    } catch (error) {
      console.error('Get config error:', error);
      return defaultValue;
    }
  }

  // 设置系统配置
  static async setConfig(key, value, description = '') {
    try {
      const exists = await this.exists('system_configs', 'config_key = ?', [key]);
      
      if (exists) {
        return await this.update('system_configs', 
          { config_value: value, description }, 
          'config_key = ?', [key]);
      } else {
        return await this.insert('system_configs', {
          config_key: key,
          config_value: value,
          description
        });
      }
    } catch (error) {
      console.error('Set config error:', error);
      throw error;
    }
  }
}

module.exports = DatabaseUtils; 