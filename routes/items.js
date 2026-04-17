const express = require("express");
const itemsController = require("../controllers/itemsController");

const router = express.Router();

router.get("/", itemsController.getItems);

router.get("/:id/update", itemsController.updateItemGet);
router.put("/:id", itemsController.updateItemPut);
router.delete("/:id", itemsController.deleteItem);

router.get("/create", itemsController.createItemGet);
router.post("/create", itemsController.createItemPost);

module.exports = router;