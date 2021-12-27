/*##############################################################################
# File: Synchronizer.js                                                         #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

require("./utils/arrays");
const config = require("./config");
const path = require("path");
const loggerFactory = require("./utils/loggerFactory");

const SyncLog = require("./db/models/syncLog");
const User = require("./db/models/user");

const ruleExecutor = require("./rules/RuleExecutor");
const DiscordBot = require("./discordBot");
const userCleanupService = require("./services/userCleanupService");
/**
 * Synchronizes the roles assigned to users ever N minutes as defined in the
 * SYNC_INTERVAL_IN_MINUTES .env variable
 */
class Synchronizer {



  /**
   * Starts a scheduled task which will refresh/synchronize user roles against
   * the verified users wallet/holdings every N minutes as defined in the
   * SYNC_INTERVAL_IN_MINUTES .env variable
   */
  start() {
    const logDir = path.join(__dirname, "../log");
    let logger = loggerFactory.create(logDir, "sync.log", "sync");
    this.logger = logger;

    logger.info("Starting Synchronizer...");

    const configuredNumberOfMinutes =
      parseInt(config.sync.numberOfMinutes) || 1;
    const schedule = configuredNumberOfMinutes * 60000;

    const firstExecutionTime = new Date(new Date().getTime() + schedule);
    logger.info(
      `Synchronizer will run every ${configuredNumberOfMinutes} minutes. First execution will start at ${this.toLocaleFormat(
        firstExecutionTime
      )}`
    );

    // re-verify roles

    this.interval = setInterval(async () => {
    // this.interval = async () => {
      await this.execute();
    }, schedule);
    
    //}; this.interval();
  }

  async execute() {
    let logger = this.logger;
    
    if(this.isExecuting) {
      logger.info(`Sync interval has attempted to start execution of a cycle while the previous cycle is still running.`)
      logger.info(`Skipping sync cycle at ${new Date().toLocaleString()}`)
    }

    this.isExecuting = true;
    const syncLog = new SyncLog();
    let now = new Date();
    syncLog.startTime = now;

    logger.info(
      `Synchronizer execution cycle starting: ${this.toLocaleFormat(now)}.`
    );
    

    let cutoff = new Date(new Date().getTime());
    logger.info(
      `Searching for users who have not reverified since ${this.toLocaleFormat(
        cutoff
      )}`
    );

    const guild = DiscordBot.getGuild();

    //retrieve the users from the db whos last verification is older than the cutoff
    const dbUsers = await User.find({
      lastVerified: { $lte: cutoff },
    })
    .sort([[ 'lastVerified', 'descending' ]])
    .exec();

    if(!dbUsers.length > 0) {
      logger.info(
        `No users require re-verification at this time ${this.toLocaleFormat(
          cutoff
        )}`
      );  
    }
    await dbUsers.forEachAsync(async (user) => {
      const discordUser = await guild.members.fetch(user.userId, {force: true});

      logger.info(
        `Reverifying user: ${discordUser.displayName} (${discordUser.nickname}) using wallet ${user.walletAddress}`
      );

      let status = await ruleExecutor.run(user);
      if(!status || status.length <= 0) {
        logger.error(`Rule execution returned an empty result. Not updating the users status/last verified date. Will reattempt verification of this user on the next cyle: ${user.walletAddress}`)
      }
      else {
        user.status = status;
        user.lastVerified = now.getTime();
        user.save();
  
        await userCleanupService.cleanup(user, ruleExecutor, logger);  
      }
      
    });
    syncLog.save();
    this.isExecuting = false;
  }

  /**
   * Stops the scheduled task
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  toLocaleFormat(dt) {
    return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}`;
  }
}

module.exports = new Synchronizer();
