const express = require("express");
const itemsController = require("../controllers/itemsController");

const router = express.Router();

router.get("/", itemsController.getItems);

router.get("/:id", itemsController.getItem);
router.delete("/:id", itemsController.deleteItem);

router.get("/:id/update", itemsController.updateItemGet);
router.put("/:id/update", itemsController.updateItemPut);

router.get("/create", itemsController.createItemGet);
router.post("/create", items.itemsController.createItemPost);

module.exports = router;