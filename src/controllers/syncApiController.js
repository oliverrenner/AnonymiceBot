const logger = require("../utils/logger");
const User = require("../db/models/user");
const ruleExecutor = require("../rules/RuleExecutor");
const RequestError = require("../utils/RequestError");
const userCleanupService = require("../services/userCleanupService");


class SyncApiController {
  async syncUser(req, res) {
    let userId = req.query.userId;
    let walletAddress = req.query.walletAddress;

    if (!userId && !walletAddress) {
      throw new RequestError(
        400,
        `Request was made to Sync user but was not provided with a userId or walletAddress.`
      );
    }

    let user;
    if (userId) {
      logger.info(`Processing request to Sync user by userId: ${userId}`);
      user = await this.getUserByUserId(userId);
    } else if (walletAddress) {
      logger.info(
        `Processing request to Sync user by walletAddress: ${walletAddress}`
      );
      user = await this.getUserByWalletAddress(walletAddress);
    }

    if (!user) {
      throw new RequestError(400, `Could not find the specified user ${user}`);
    }

    let status = await ruleExecutor.run(user);
    user.status = status;
    user.lastVerified = new Date().getTime();
    user.save();

    await userCleanupService.cleanup(user, ruleExecutor, logger);

    res
      .status(200)
      .json({
        status,
      })
      .end();
  }

  async getUserByUserId(userId) {
    return await User.findOne({ userId: userId }).exec();
  }

  async getUserByWalletAddress(walletAddress) {
    return await User.findOne({ walletAddress: { '$regex': walletAddress, '$options': 'i' } }).exec();
  }
}

module.exports = new SyncApiController();
