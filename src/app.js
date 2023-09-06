require("dotenv").config({ path: ".env" });
const express = require("express");
const cors = require("cors");
const router = require("./router");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(router);

module.exports = app;
