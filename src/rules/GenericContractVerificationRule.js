/*##############################################################################
# File: genericContractVerifier.js                                             #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

const getProvider = require("../web3/provider");
const { Contract } = require("ethers");

class GenericContractVerificationRule {
  constructor(config) {
    this.config = config;
    this.logger = require("../utils/logger");
  }

  async execute(discordUser, role, result) {
    try {
      if (!role) {
        this.logger.info("Role not found, please make sure to use the correct role id.")
        return;
      }
      let userQualifiesForRole = result === true;
      if (userQualifiesForRole && !discordUser.roles.cache.has(role.id)) {
        this.logger.info(`Assigning Role: ${role.name}`);
        await discordUser.roles.add(role);
      } else {
        if (discordUser.roles.cache.has(role.id)) {
          this.logger.info(`Removing Role: ${role.name}`);
          await discordUser.roles.remove(role);
        }
      }
    } catch (err) {
      this.logger.error(err.message);
    }
  }

  async check(user) {
    let logMessage = `Generic Contract Executor is executing:
Contract:       ${this.config.contractAddress}
Method:         ${this.config.method}
Argument(s):    ${user.walletAddress}`;
    try {
      const provider = await getProvider();
      const contract = new Contract(
        this.config.contractAddress,
        this.config.contractAbi,
        provider
      );
      let result = await contract[this.config.method](user.walletAddress);
      let count = result.toNumber() > 0;
      logMessage += `
Result:       ${result}`;
      this.logger.info(logMessage);
      return count;
    } catch (e) {
      this.logger.error(e.message);
      return false;
    }
  }
}

module.exports = GenericContractVerificationRule;
