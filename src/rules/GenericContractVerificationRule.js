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

  /**
   * Executes changes to the Discord Users assigned roles using the result from
   * the check method
   * 
   * @param discordUser - The Discord User
   * @param role - The Discord Role which should be affected
   * @param result - The result returned from the check method
   */
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

      return {
        role: role.name,
        roleId: role.id,
        qualified: userQualifiesForRole,
        result: result
      }

    } catch (err) {
      this.logger.error(err.message);
    }
  }

  /**
   * Executes the Contract method specified and returns the result
   * 
   * @param user - The User DB record
   * @returns a result to be consumed in the execute method
   */
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
      let contractResult = await contract[this.config.method](user.walletAddress);
      let result = contractResult.toNumber() > 0;
      logMessage += `
Result:       ${contractResult}`;
      this.logger.info(logMessage);
      return result;
    } catch (e) {
      this.logger.error(e.message);
      return false;
    }
  }
}

module.exports = GenericContractVerificationRule;
