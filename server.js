const express = require("express");

const app = express();

app.set("view engine","ejs");

app.use(express.static("public"));
app.use(express.urlencoded());



app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send("Something went wrong");
});