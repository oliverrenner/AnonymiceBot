const logger = require("../utils/logger");
const getProvider = require("../web3/provider");
const { Contract, utils } = require("ethers");

class GenesisMouseVerificationRule {
  constructor(config) {
    this.config = config;
  }

  async execute(user) {
    const provider = await getProvider();
    let gensisMiceResult = await this.getGenesisMice(
      this.config.AnonymiceContract,
      user,
      provider
    );
    let babyMiceResult = await this.getBabyMice(
      this.config.AnonymiceBreedingContract,
      user,
      provider
    );
    let cheethGrindingMiceResult = await this.getCheethGrindingMice(
      this.config.CheethContract,
      user,
      provider
    );
    let breedingMiceResult = await this.getBreedingMice(
      this.config.AnonymiceBreedingContract,
      user,
      provider
    );

    let result = {
      mice: gensisMiceResult,
      babies: babyMiceResult,
      cheethGrinding: cheethGrindingMiceResult,
      breeding: breedingMiceResult,
    };
    return result;
  }

  async getGenesisMice(config, user, provider) {
    let logMessage = `Genesis Mouse Verifier is executing - Get Genesis Mice:
Contract:       ${config.Address}
Argument(s):    ${user.walletAddress}`;

    const contract = new Contract(config.Address, config.ABI, provider);

    const result = await contract.balanceOf(user.walletAddress);

    logMessage += `
Result:       ${result}`;
    logger.info(logMessage);

    return result.toNumber() > 0 ? [1] : []; // quickfix as we dont get tokenIds
  }

  async getBabyMice(config, user, provider) {
    let logMessage = `Genesis Mouse Verifier is executing - Get Baby Mice:
Contract:       ${config.Address}
Argument(s):    ${user.walletAddress}`;

    const contract = new Contract(config.Address, config.ABI, provider);

    const result = await contract.balanceOf(user.walletAddress);

    logMessage += `
Result:       ${result}`;
    logger.info(logMessage);

    return result.toNumber() > 0 ? [1] : []; // quickfix as we dont get tokenIds
  }

  async getCheethGrindingMice(config, user, provider) {
    let logMessage = `Genesis Mouse Verifier is executing - Get Cheeth Grinding Mice:
Contract:       ${config.Address}
Argument(s):    ${user.walletAddress}`;

    const contract = new Contract(config.Address, config.ABI, provider);

    const result = await contract.getTokensStaked(user.walletAddress);
    logMessage += `
Result:       ${result}`;
    logger.info(logMessage);

    return result.map(r => r.toNumber());
  }

  async getBreedingMice(config, user, provider) {
    let logMessage = `Genesis Mouse Verifier is executing - Get Breeding Mice:
Contract:       ${config.Address}
Argument(s):    ${user.walletAddress}`;

    const contract = new Contract(config.Address, config.ABI, provider);

    const pairs = await contract.getBreedingEventsLengthByAddress(
      user.walletAddress
    );
    const results = [];
    for (let i = 0; i < pairs.toNumber(); i++) {
      const breedingEvent = await contract._addressToBreedingEvents(
        user.walletAddress,
        i
      );
      results.push(breedingEvent.parentId1);
      results.push(breedingEvent.parentId2);
    }
    let result = results.map((r) => r.toNumber());

    logMessage += `
Result:       ${results}`;
    logger.info(logMessage);

    return result;
  }
}

module.exports = GenesisMouseVerificationRule;
