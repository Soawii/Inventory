const { body, param, matchedData, validationResult } = require("express-validator");
const pool = require("../db/pool");

exports.getCategories = (req, res) => {
    pool.query(`SELECT * FROM categories ORDER BY id`)
        .then(result => {
            res.render("categories", { categories: result.rows });
        })
        .catch(err => {
            console.log(err);
            res.status(404).render("notfound", { title: "Database access error" });
        });
};

exports.updateCategoryGet = [
    param("id")
        .isInt().withMessage("Category ID should be an integer").toInt()
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
            return res.status(404).render("notfound", { title: "Category not found" });
        }

        pool.query("SELECT * FROM categories WHERE id = $1", [req.params.id])
            .then(result => {
                res.render("createcategory", { 
                    title: "Update Category", 
                    action: `/categories/${req.params.id}?_method=PUT`, 
                    formdata: {
                        title: result.rows[0].title
                    }
                });
            })
            .catch(err => {
                console.log(err);
                res.status(404).render("notfound", { title: "Database access error" });
            });
    }
];

exports.updateCategoryPut = [
    param("id")
        .isInt().withMessage("Category ID should be an integer").toInt()
        .custom(async id => {
            const categories = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
            if (categories.rowCount == 0) {
                throw new Error("Category does not exist");
            }
            return true;
        }).withMessage("Category does not exist"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("not found", { title: "Category ID does not exist" });
        } 
        next();
    },

    body("title")
        .isLength({ min: 1, max: 30 }).withMessage("Category title should have from 1 to 30 characters"),

    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("createcategory", { 
                title: "Update Category", 
                action: `/categories/${req.params.id}?_method=PUT`, 
                formdata: {
                    title: req.body.title
                },
                errors: errors.array()
            });
        }
        const { title } = matchedData(req);

        (async () => {
            try {
                await pool.query(`
                    UPDATE categories
                    SET title = $1
                    WHERE id = $2`, 
                    [title, req.params.id]);

                res.redirect("/categories");
            }
            catch (err) {
                console.log(err);
                res.status(404).render("notfound", { title: "Database access error" });
            }
        })();
    }
];

exports.deleteCategory = [
    param("id")
        .isInt().withMessage("Category ID should be an integer").toInt()
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
            return res.status(404).render("notfound", { title: "Category not found" });
        }
        
        (async () => {
            try {
                await pool.query(`
                    DELETE FROM items_categories
                    WHERE category_id = $1`,
                    [req.params.id]);

                await pool.query(`
                    DELETE FROM categories
                    WHERE id = $1`,
                    [req.params.id]);

                res.redirect("/categories");
            }
            catch (err) {
                console.log(err);
                res.status(404).render("notfound", { title: "Database access error" });
            }
        })();
    }
];

exports.createCategoryGet = (req, res) => {
    res.render("createcategory");
};

exports.createCategoryPost = [
    body("title")
        .isLength({ min: 1, max: 30 }).withMessage("Category title should have from 1 to 30 characters"),

    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("createcategory", { errors: errors.array(), formdata: { title: req.body.title } });
        }
        const { title } = matchedData(req);

        pool.query(`INSERT INTO categories (title) VALUES ($1)`, [title])
            .then(() => {
                res.redirect("/categories");
            })
            .catch(err => {
                console.log(err);
                res.status(500).render("createcategory", { errors: [ { msg: "Database error" } ], formdata: { title: req.body.title } });
            });
    }
];