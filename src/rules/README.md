# Anonymice Discord Bot - Verification Rules

To add additional Verification Rules, create a Verification Rule 
using the follow template and configure your Rule for use in 
`/settings.js`. 

Your Verification Rule will be executed automatically, initially
when users verify using web 3 as well as during scheduled 
synchronization jobs.

```js


const getProvider = require("../web3/provider");
const { Contract, utils } = require("ethers");

class MyContractVerificationRule {
  constructor(config) {
    this.config = config;
    this.logger = require("../utils/logger");
  }

  async execute(user) {
    let logMessage = `My Contract Rule is executing:
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
      logger.error(e.message);
      return false;
    }
  }
}

module.exports = MyContractVerificationRule;

```