const express = require("express");
const categoriesController = require("../controllers/categoriesController");

const router = express.Router();

router.get("/", categoriesController.getCategories);

router.get("/:id/update", categoriesController.updateCategoryGet);
router.put("/:id", categoriesController.updateCategoryPut);
router.delete("/:id", categoriesController.deleteCategory);

router.get("/create", categoriesController.createCategoryGet);
router.post("/create", categoriesController.createCategoryPost);

module.exports = router;