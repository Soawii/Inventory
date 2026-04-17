const { Pool } = require("pg");

module.exports = new Pool({
    database: "top_users",
    user: process.env.USER,
    password: process.env.PASSWORD,
    host: "localhost",
    port: 5432
});