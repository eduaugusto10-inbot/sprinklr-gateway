const mysql = require("mysql2");

// Initialize database pool
const config = {
  host: "inbot-instance-1.cwqugt9psr2i.us-east-1.rds.amazonaws.com",
  user: "sprinklrgw",
  password: "NhMoh9f!vMqNBY",
  database: "inbot",
  port: 3306,
  connectionLimit: 20,
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
