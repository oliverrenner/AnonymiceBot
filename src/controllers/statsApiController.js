const logger = require("../utils/logger");
const config = require("../config");
const fs = require("fs");
const path = require("path");
let useDevSettings = false;
if (
  config.envName === "development" &&
  fs.existsSync(path.join(__dirname, "../config/settings.development.js"))
) {
  useDevSettings = true;
}
const settings = useDevSettings
  ? require("../config/settings.development")
  : require("../config/settings");
const User = require("../db/models/user");
const VerificationRequest = require("../db/models/verificationRequest");

class StatsController {
  constructor() {
    let verificationConfig = settings.rules.find(
      (r) => r.name === "Anonymice Verifier"
    );
    this.roleConfiguration = verificationConfig.executor.config.roles;
  }
  async getTotal(req, res) {
    const result = await User.count().exec();
    res
      .status(200)
      .json({
        count: result,
      })
      .end();
  }

  async getGenesis(req, res) {
    let roleId = this.roleConfiguration.find(
      (r) => r.name === "Genesis Mice"
    ).id;
    const result = await User.count({
      status: { $elemMatch: { roleId: roleId, qualified: true } },
    });
    res
      .status(200)
      .json({
        count: result,
      })
      .end();
  }

  async getBabies(req, res) {
    let roleId = this.roleConfiguration.find((r) => r.name === "Baby Mice").id;
    const result = await User.count({
      status: { $elemMatch: { roleId: roleId, qualified: true } },
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

  async getUserOfAddress(req, res) {
    let walletAddress = req.query.walletAddress;
    const user = await User.findOne({
      walletAddress: { $regex: walletAddress, $options: "i" },
    }).exec();
    res
      .status(200)
      .json({
        user: user,
      })
      .end();
  }

  async getUserOfUserId(req, res) {
    let userId = req.query.userId;
    const user = await User.findOne({
      userId: { $regex: userId, $options: "i" },
    }).exec();
    res
      .status(200)
      .json({
        user: user,
      })
      .end();
  }
}

module.exports = new StatsController();
