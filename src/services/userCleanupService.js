const User = require("../db/models/user");

class UserCleanupService {

  /**
   * Searches for other User records tied to the provided Users walletAddress and discord userId
   * If it finds other discord users tied to the walletAddress - it temporarily assigns that user record
   * an empty walletAddress and executes verification for the user effectively removing all of their assigned roles
   * Finally, it removes the duplicate user records from the db
   * @param {*} user 
   * @param {*} ruleExecutor 
   * @param {*} logger 
   */
  async cleanup(user, ruleExecutor, logger) {
    //look for other Users which have the same wallet assigned as the provided user
    //any users found should have their role removed and their User records removed
    let usersByWallet = await User.find({
      walletAddress: { $regex: user.walletAddress, $options: "i" },
    }).exec();
    await usersByWallet.forEachAsync(async (u) => {
      if (u.id !== user.id) {
        //set wallet to invalid/unknown and run verification to eliminate the users roles
        user.walletAddress = null;
        await ruleExecutor.run(user);
        logger.info(
          `Deleting User using DB id:${u.id} found tied to the same wallet as ${user.id}`
        );
        await u.deleteOne();
      }
    });

    //look for any other User records for the same discord user
    //any found should be removed
    let usersByDiscord = await User.find({ userId: user.userId }).exec();
    await usersByDiscord.forEachAsync(async (u) => {
      if (u.id !== user.id) {
        logger.info(
          `Deleting User using DB id:${u.id} which appears to be tied to the same discord user who has signed in ${user.userId}`
        );
        await u.deleteOne();
      }
    });
  }
}
module.exports = new UserCleanupService();