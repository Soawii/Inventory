/*

router.get("/", itemsController.getItems);

router.get("/:id", itemsController.getItem);
router.delete("/:id", itemsController.deleteItem);

router.get("/:id/update", itemsController.updateItemGet);
router.put("/:id/update", itemsController.updateItemPut);

router.get("/create", itemsController.createItemGet);
router.post("/create", items.itemsController.createItemPost);

*/

const express = require("express");
const Inventory = require("../models/invetory");

exports.getItems = (req, res) => {
    const query_categories = req.query.categories 
        ? req.query.categories.split(',')
        : [];

    query_categories = query_categories.filter((c) => {
        return /^\d+$/.test(c);
    })
    .map(c => Number(c))
    .filter(c => (Inventory.categories.indexOf(c) !== -1)); 

    const items = Inventory.getItems(query_categories);
    res.render("items", { items, query_categories, categories: Inventory.categories });
};

exports.getItems = (req, res) => {

}