const pool = require("./pool");

const SQL = `
    DROP TABLE IF EXISTS items_categories;
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS categories;

    CREATE TABLE items (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        title VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        price FLOAT NOT NULL,
        amount INTEGER NOT NULL
    );

    CREATE TABLE categories (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        title VARCHAR(255)
    );

    CREATE TABLE items_categories (
        item_id INTEGER,
        category_id INTEGER,
        CONSTRAINT fk_item
            FOREIGN KEY (item_id) REFERENCES items(id),
        CONSTRAINT fk_category
            FOREIGN KEY (category_id) REFERENCES categories(id),
        PRIMARY KEY (item_id, category_id)
    );

    INSERT INTO items (title, description, price, amount) 
    VALUES ('item1', 'best item', 1000.0, 10), 
    ('item2', 'good item', 2000.0, 5),
    ('item3', 'mid item', 3000.0, 1);

    INSERT INTO categories (title) 
    VALUES ('cat1'), ('cat2'), ('cat3');

    INSERT INTO items_categories (item_id, category_id)
    VALUES (1, 1), (1, 2), (1, 3), (2, 2), (3, 3);
`;

async function main() {
    console.log("Connecting to  db...");
    await pool.query(SQL);
    console.log("Connection success!");
}

main();