const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const helmet = require("helmet");
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const httpStatus = require("http-status")

const RequestError = require('./utils/RequestError');
const signIn = require('./controllers/signin');

const app = express();

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// add support for request body in json format
app.use(bodyParser.json());

// turn off parsing urlencoded request body
app.use(express.urlencoded({ extended: false }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// wire up static assets
app.use("/assets", express.static(path.join(__dirname, "../public/assets")));

/* manually wiring supported "routes" */

// health check endpoint for node server
app.get("/status", [
  (req, res) => {
    return res.send("Health Check: 200! Ok");
  },
]);

// server the discord bot verification html page
app.get("/verification-page.html", function (request, response) {
  response.sendFile("./src/views/verification-page.html", { root: "." });
});


app.post("/api/sign_in", async (req, res) => {
  signIn.post(req, res);
});

// send back a 404 error for any unknown request
app.use((req, res, next) => {
  next(new RequestError(httpStatus.NOT_FOUND, "Not found"));
});

module.exports = app;