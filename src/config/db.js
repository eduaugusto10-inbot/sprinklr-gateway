const mysql = require("mysql2");

// Initialize database pool
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 20
};

const pool = mysql.createPool(config);

pool.getConnection((error, conn) => {
  if (error) {
    throw error;
  }
  console.log("Conectado ao banco de dados");
  pool.releaseConnection(conn);
});

module.exports = pool;
