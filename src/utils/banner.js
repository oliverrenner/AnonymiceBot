/*##############################################################################
# File: banner.js                                                              #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

const path = require("path");
const fs = require("fs");
const banner = fs.readFileSync(path.join(__dirname, "../banner.txt"));
module.exports = banner;