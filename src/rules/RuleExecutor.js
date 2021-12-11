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
    let results = [];
    await this.rules.forEachAsync(async (rule) => {
      
      let executionResult = await rule.executor.execute(user);
      let isSuccess = executionResult !== "undefined" && executionResult;

      let result = {
        name: rule.name,
        roleId: rule.roleId,
        result: typeof(executionResult) === 'undefined' ? {} : executionResult,
        isSuccess: isSuccess === true,
      };
      results.push(result);
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

    await results.forEachAsync(async (result) => {
      try {
        let role = await guild.roles.fetch(result.roleId);

        if (result.isSuccess && !discordUser.roles.cache.has(role.id)) {
          logger.info(`Assigning Role: ${role.name}`);
          await discordUser.roles.add(role);
        } 
        else {
  
          if (discordUser.roles.cache.has(role.id)) {
            logger.info(`Removing Role: ${role.name}`);
            await discordUser.roles.remove(role);
          }
        }
      }
      catch(err) {
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
    `
    return results;
  }
}

module.exports = new RuleExecutor();
