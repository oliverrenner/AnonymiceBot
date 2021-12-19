/*##############################################################################
# File: app.js                                                                 #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");

const signinPageController = require("./controllers/signinPageController");
const signinApiController = require("./controllers/signinApiController");
const statsApiController = require("./controllers/statsApiController");
const syncApiController = require("./controllers/syncApiController");
const logger = require("./utils/logger");

/*##############################################################################
express configuration
##############################################################################*/

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

/*##############################################################################
express view engine - ejs
##############################################################################*/
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");

/*##############################################################################
express routes - static assets
##############################################################################*/
// wire up static assets
app.use("/assets", express.static(path.join(__dirname, "../public/assets")));

// web page providing web 3 sign in
app.get("/signin", async function (req, res) {
  signinPageController.get(req, res);
});

// web 3 signature verification
app.post("/api/signin", async (req, res) => {
  signinApiController.post(req, res);
});

/*##############################################################################
express routes - sync/user
##############################################################################*/
app.get("/api/sync", async(req, res) => {
  syncApiController.syncUser(req, res);
})


/*##############################################################################
express routes - stats/utilities
##############################################################################*/
/* stats */

// retrieves the total number mice (genesis and baby) a verified user holds
app.get("/api/stats/total", async (req, res) => {
  statsApiController.getTotal(req, res);
});

// retrieves the number of genesis mice a verified user holds
app.get("/api/stats/mice", async (req, res) => {
  statsApiController.getGenesis(req, res);
});

// retrieves the number of baby mice a verified user holds
app.get("/api/stats/babymice", async (req, res) => {
  statsApiController.getBabies(req, res);
});

// retrieves the total number of signature verification requests the system has served
app.get("/api/stats/verifications", async (req, res) => {
  statsApiController.getVerifications(req, res);
});

// health check endpoint for node server
app.get("/status", [
  (req, res) => {
    return res.send("Health Check: 200! Ok");
  },
]);

// send back a 404 error for any unknown request
app.use((err, req, res, next) => {
  if (err) {
    logger.error(err.message);
  }
  else {
    logger.info("oops");
  }  
});

module.exports = app;
