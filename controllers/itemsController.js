const express = require("express");
const { body, param, query, matchedData, validationResult } = require("express-validator");
const pool = require("../db/pool");

function setCategoryIdsOfItems(items, items_categories) {
    const m = new Map();
    for (let i = 0; i < items.length; i++) {
        m.set(items[i].id, i);
        items[i].category_ids = [];
    }
    for (let i = 0; i < items_categories.length; i++) {
        const item_idx = m.get(items_categories[i].item_id);
        if (item_idx !== undefined) {
            items[item_idx].category_ids.push(items_categories[i].category_id);
        }
    }
}

exports.getItems = [
    query("category_id")
        .optional()
        .isInt({ min: 0 }).withMessage("Category ID has to be a non-negative integer")
        .custom(async id => {
            const categories = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
            if (categories.rowCount == 0) {
                throw new Error("Category does not exist");
            }
            return true;
        }).withMessage("Category does not exist"),
    
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("notfound", { title: "Category does not exist" });
        }

        const promise_items_categories = pool.query(`
            SELECT * FROM items_categories;    
        `);
        let promise_items;

        if (req.query.category_id) {
            promise_items = pool.query(`
                SELECT id,title,description,price,amount FROM items_categories
                LEFT JOIN items ON items.id = items_categories.item_id
                WHERE items_categories.category_id = $1;
            `, [req.query.category_id]);
        }
        else { 
            promise_items = pool.query(`SELECT * FROM items ORDER BY id`);
        }
        const promise_categories = pool.query(`SELECT * FROM categories`);

        Promise.all([promise_items_categories, promise_items, promise_categories])
            .then(([items_categories, items, categories]) => {
                items_categories = items_categories.rows;
                items = items.rows;
                categories = categories.rows;

                setCategoryIdsOfItems(items, items_categories);
                if (req.query.category_id) {
                    res.render("items", { items, categories, selected_category_id: Number(req.query.category_id) });
                }
                else {
                    res.render("items", { items, categories });
                }
            })
            .catch(err => {
                res.render("notfound", { title: "Database access error" });
            });
    }
];

exports.updateItemGet = [ 
    param("id")
        .isInt({ min: 0 }).withMessage("Item ID should be a positive integer")
        .toInt()
        .custom(async id => {
            const item = await pool.query(`SELECT * FROM items WHERE id = $1;`, [id]);
            if (item.rows.length == 0) {
                throw new Error("Item does not exist");
            }
            return true;
        }).withMessage("Item ID does not exist"),
        
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(404).render("notfound", { title: "Item ID not found" });
        }
        const { id } = matchedData(req);

        const promise_item = pool.query(`SELECT * FROM items WHERE id = $1;`, [id]);
        const promise_categories = pool.query(`SELECT * FROM categories;`);
        const promise_items_categories = pool.query(`SELECT * FROM items_categories;`);

        Promise.all([promise_item, promise_categories, promise_items_categories])
            .then(([item, categories, items_categories]) => {
                item = item.rows;
                categories = categories.rows;
                items_categories = items_categories.rows;

                setCategoryIdsOfItems(item, items_categories);
                item = item[0];

                res.render("createitem", {
                    title: "Update Item",
                    action: `/items/${id}?_method=PUT`,
                    categories, 
                    formdata: {
                        title: item.title,
                        description: item.description,
                        price: item.price,
                        amount: item.amount,
                        category: item.category_ids
                    },
                });
            })
            .catch(err => {
                res.render("notfound", { title: "Database access error" });
            });
    }
];

exports.updateItemPut = [
    param("id")
        .isInt({ min: 0 }).withMessage("Item ID should be a positive integer")
        .toInt()
        .custom(async id => {
            const item = await pool.query(`SELECT * FROM items WHERE id = $1;`, [id]);
            return item.rows.length > 0;
        }).withMessage("Item ID does not exist"),
    body("title")
        .isString().withMessage("Title has to be a string")
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage("Title has to be from 1 to 100 characters long"),
    body("description")
        .isString().withMessage("Description has to be a string")
        .trim()
        .isLength({ max: 200 }).withMessage("Description has to be from 0 to 200 characters long"),
    body("price")
        .isFloat({ min: 1 }).withMessage("Price must be an integer >= 1")
        .toFloat(),
    body("amount")
        .isInt({ min: 0 }).withMessage("Amount must be an integer >= 0")
        .toInt(),
    body("category")
        .toArray(),
    body("category.*")
        .isInt().withMessage("Error while selecting categories")
        .toInt()
        .custom(async (category_id) => {
            const result = await pool.query("SELECT * FROM categories WHERE id = $1;", [category_id]);
            return result.rows.length > 0;
        }).withMessage("Category does not exist"),
    
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            pool.query("SELECT * FROM categories")
                .then(result => {
                    res.status(400).render("createitem", {
                        title: "Update Item",
                        action: `/items/${req.params.id}?_method=PUT`,
                        categories: result.rows,
                        errors: errors.array(),
                        formdata: req.body
                    });
                });
            return;
        }

        const { id, title, description, price, amount, category } = matchedData(req);

        (async () => {
            const client = await pool.connect();
            try {
                client.query("BEGIN");

                await client.query(`
                    UPDATE items 
                    SET title = $1, description = $2, price = $3, amount = $4
                    WHERE id = $5;`, 
                    [title, description, price, amount, id]
                );

                await client.query(`
                    DELETE FROM items_categories
                    WHERE item_id = $1;`, 
                    [id]
                );

                if (category.length > 0) {
                    let insert_sql = `INSERT INTO items_categories (item_id, category_id) VALUES`;
                    const values = category.map((c, i) => `($1, $${i+2})`);
                    insert_sql += " " + values.join(",") + ";";
                    await client.query(insert_sql, [id, ...category]);
                }

                await client.query("COMMIT");
                res.redirect("/items");
            }
            catch (err) {
                await client.query("ROLLBACK");
                console.log(err);
                res.render("notfound", { title: "Database access error" });
            }
            finally {
                client.release();
            }
        })();
    }
];

exports.deleteItem = [
    param("id")
        .isInt({ min: 0 }).withMessage("Item ID should be a positive integer")
        .toInt()
        .custom(async id => {
            const item = await pool.query(`SELECT * FROM items WHERE id = $1;`, [id]);
            return item.rows.length > 0;
        }).withMessage("Item ID does not exist"),
    
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(404).render("notfound", { title: "Item ID not found" });
        }
        
        const { id } = matchedData(req);
        (async () => {
            try {
                await pool.query(`
                    DELETE FROM items_categories
                    WHERE item_id = $1
                    `, [id]);

                await pool.query(`
                    DELETE FROM items
                    WHERE id = $1
                    `, [id]);

                res.redirect("/items");
            }
            catch (err) {
                console.log(err);
                res.render("notfound", { title: "Database access error" });
            }
        })();
    }
];

exports.createItemGet = (req, res) => {
    pool.query(`SELECT * FROM categories`)
        .then(result => {
            res.render("createitem", { title: "Create Item", categories: result.rows })
        })
        .catch(err => {
            console.log(err);
            res.render("notfound", { title: "Database access error" });
        })
};

exports.createItemPost = [
    body("title")
        .isString().withMessage("Title has to be a string")
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage("Title has to be from 1 to 100 characters long"),
    body("description")
        .isString().withMessage("Description has to be a string")
        .trim()
        .isLength({ max: 200 }).withMessage("Description has to be from 0 to 200 characters long"),
    body("price")
        .isFloat({ min: 1 }).withMessage("Price must be an integer >= 1")
        .toFloat(),
    body("amount")
        .isInt({ min: 0 }).withMessage("Amount must be an integer >= 0")
        .toInt(),
    body("category")
        .toArray(),
    body("category.*")
        .isInt().withMessage("Error while selecting categories")
        .toInt()
        .custom(async (category_id) => {
            const result = await pool.query("SELECT * FROM categories WHERE id = $1;", [category_id]);
            return result.rows.length > 0;
        }).withMessage("Category does not exist"),

    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            pool.query(`SELECT * FROM categories`)
                .then(result => {
                    res.status(400).render("createitem", { 
                        categories: result.rows, 
                        errors: errors.array(),
                        formdata: req.body
                    });
                })
            return;
        }
        
        const { title, description, price, amount, category } = matchedData(req);

        (async () => {
            try {
                const item_result = await pool.query(`
                    INSERT INTO items (title, description, price, amount) VALUES ($1, $2, $3, $4) RETURNING id
                    `, [title, description, price, amount]);

                const item_id = item_result.rows[0].id;

                if (category.length > 0) {
                    let items_categories_sql = `INSERT INTO items_categories (item_id, category_id) VALUES`;
                    const values = category.map((c, i) => `($1, $${i+2})`);
                    items_categories_sql += " " + values.join(",") + ";";
                    const items_categories = await pool.query(items_categories_sql, [item_id, ...category]);
                }

                res.redirect("/items");
            }
            catch (err) {
                console.log(err);
                res.render("notfound", { title: "Database access error" });
            }
        })();
    }
];