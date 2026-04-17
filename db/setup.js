const pool = require("./pool");

module.exports = async function db_setup() {
    console.log("Creating tables...");

    await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            title VARCHAR(255) NOT NULL,
            description VARCHAR(255),
            price NUMERIC(10,2) NOT NULL,
            amount INTEGER NOT NULL
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            title VARCHAR(255)
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS items_categories (
            item_id INTEGER,
            category_id INTEGER,
            CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES items(id),
            CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id),
            PRIMARY KEY (item_id, category_id)
        );
    `);

    console.log("Tables created!");
}