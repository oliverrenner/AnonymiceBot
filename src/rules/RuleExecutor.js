require("../utils/arrays");
const config = require("../config");
const settings = require("../../settings");
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

        //if the configuration has a role id, we expect that should resolve to a discord role
        //otherwise we will assume the verification rule is custom and will figure out the
        //roles it needs to deal with internally
        if (rule.roleId && !role) {
          logger.info(
            "Role not found, please make sure to use the correct role id."
          );
          return;
        }

        let executionResult = await rule.executor.execute(
          discordUser,
          role,
          rule.result
        );

        if (Array.isArray(executionResult)) {
          results.push(...executionResult);
        } else {
          results.push(executionResult);
        }
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
