const logger = require("../utils/logger");
const User = require("../db/models/user");
const VerificationRequest = require("../db/models/verificationRequest");

class StatsController {
  async getTotal(req, res) {
    const result = await User.count();
    res
      .status(200)
      .json({
        count: result,
      })
      .end();
  }

  async getGenesis(req, res) {
    const result = await User.count({
      $and: [
        {"status.name": "Mice"},
        {"status.result.mice": { $gt: 0 } }
      ]
    });
    res
      .status(200)
      .json({
        count: result,
      })
      .end();
  }

  async getBabies(req, res) {
    const result = await User.count({
      $and: [
        {"status.name": "Baby Mice"},
        {"status.result": true }
      ]
    });
    res
      .status(200)
      .json({
        count: result,
      })
      .end();
  }

  async getVerifications(req, res) {
    const result = await VerificationRequest.count({});
    res
      .status(200)
      .json({
        count: result,
      })
      .end();
  }
}

module.exports = new StatsController();
