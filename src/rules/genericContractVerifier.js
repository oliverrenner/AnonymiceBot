const getProvider = require("../web3/provider");
const { Contract, utils } = require("ethers");


class GenericContractExecutor {
  constructor(config) {
    this.config = config;
    this.logger = require("../utils/logger");
  }

  async execute(user) {

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
Result:       ${result}`
      this.logger.info(logMessage);
      return count;
    } catch (e) {
      logger.error(e.message);
      return false;
    }
  }
}

module.exports = GenericContractExecutor;
