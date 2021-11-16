const mysql = require('promise-mysql');

let pool = null;
// exports.createPool = async function () {
//     pool = mysql.createPool({
//         multipleStatements: true,
//         host: process.env.MYSQL_HOST,
//         user: process.env.MYSQL_USER,
//         password: process.env.MYSQL_PASSWORD,
//         database: process.env.MYSQL_DATABASE,
//         port: process.env.MYSQL_PORT || 3306
//     });
// };

exports.createPool = async config => {
  // check if we are connecting to cloud sql or not
  if (process.env.CLOUD_SQL_CONNECTION_NAME) {
    const dbSocketPath = process.env.DB_SOCKET_PATH || '/cloudsql';

    // Establish a connection to the database
    pool = mysql.createPool({
      multipleStatements: true,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      // If connecting via unix domain socket, specify the path
      socketPath: `${dbSocketPath}/${process.env.CLOUD_SQL_CONNECTION_NAME}`
    });
  }
  else {
    pool = mysql.createPool({
        multipleStatements: true,
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: process.env.MYSQL_PORT || 3306
    });
  }
    
};

exports.getPool = function () {
    return pool;
};
