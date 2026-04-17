const express = require("express");
const methodOverride = require("method-override");
const itemsRouter = require("./routes/items");
const categoriesRouter = require("./routes/categories");
const app = express();

app.set("view engine","ejs");

app.use(express.static("public"));
app.use(express.urlencoded());
app.use(methodOverride("_method"));

app.get("/", (req, res) => {
    res.redirect("/items");
});
app.use("/items", itemsRouter);
app.use("/categories", categoriesRouter);

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send("Something went wrong");
});

app.listen(process.env.PORT || 3000, (err) => {
    console.log(err ? err : "Server running!");
});