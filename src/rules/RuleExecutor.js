require("../utils/arrays");
const settings = require("../../settings");
const config = require("../config");
const logger = require("../utils/logger");
const path = require("path");
const DiscordBot = require("../discordBot");

class RuleExecutor {
  constructor() {
    this.rules = [];
    settings.rules.forEach((rule) => {
      let executorType = require(path.join(__dirname, rule.executor.type));
      let executor = new executorType(rule.executor.config);
      this.rules.push({
        name: rule.name,
        roleId: rule.roleId,
        executor: executor,
      });
    });
  }

  async run(user) {
    await this.rules.forEachAsync(async (rule) => {
      rule.result = await rule.executor.check(user);
    });

    //apply changes to discord user based on the results
    const guild = DiscordBot.getGuild(config.discord.guildId);
    const discordUser = await guild.members.fetch(user.userId);
    const discordUserCurrentRoles = [];
    discordUser.roles.cache.forEach((r) => {
      discordUserCurrentRoles.push(r.name);
    });

    let logMessage = `Synchronizing roles for user: 
Discord:  ${discordUser.displayName} (${discordUser.nickname}) 
Wallet:   ${user.walletAddress}
Roles:    ${discordUserCurrentRoles}
-------------------------------------------------------------------------------`;
    logger.info(logMessage);

    let results = [];
    await this.rules.forEachAsync(async (rule) => {
      try {
        let role = await guild.roles.fetch(rule.roleId);
        await rule.executor.execute(
          discordUser,
          role,
          rule.result
        );
        
        results.push({
          name: rule.name,
          roleId: rule.roleId,
          result: rule.result,
          //todo: clean this up - only used for ui purposes and name is misleading 
          //removing the role successfully is still success
          isSuccess: discordUser.roles.cache.has(rule.roleId) 
        });
      } catch (err) {
        logger.error(err.message);
      }
    });

    let discordUserFinalRoles = [];
    discordUser.roles.cache.forEach((r) => {
      discordUserFinalRoles.push(r.name);
    });
    logMessage += `
Final Roles: ${discordUserFinalRoles}
-------------------------------------------------------------------------------
    `;
    logger.info(logMessage);
    return results;
  }
}

module.exports = new RuleExecutor();
