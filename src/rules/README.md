# Anonymice Discord Bot - Verification Rules

## Summary

A verification rule provides the ability to `check` some condition and 
`execute` some action based on the result.

For example, the `GenericContractVerificationRule` executes a Contract method 
defined in the configuration and if the result is `truthy` assigns the 
configured role to the user. If the result is not `truthy` it will remove the 
role from the user.

Verification rules are executed automatically, initially when users verify 
using web 3, as well as during scheduled synchronization jobs.

## Creating your own verification rule

To add additional Verification Rules, create a Verification Rule 
using the follow template and configure your Rule for use in 
`/settings.js`. 

If you have a more complex scenario which requires verifying more than one
role/contract, you can create a custom verification rule and ignore the 
incoming role parameter, instead relying on any configuration structure
you have defined in `settings.js` being provided at the time of execution.

The minimum acceptable definition of a verification rule must have:
- A `check` method which checks whether the provided user meets your condition.
- An `execute` method which can use the result of check to affect change to the user.

```js


const getProvider = require("../web3/provider");
const { Contract } = require("ethers");

class MyContractVerificationRule {
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

module.exports = MyContractVerificationRule;

```