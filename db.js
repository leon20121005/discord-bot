const mysql = require('mysql');

const connectionPool = mysql.createPool({
    user:     process.env.user,
    password: process.env.password,
    host:     process.env.host,
    database: process.env.database
});

module.exports = connectionPool;
