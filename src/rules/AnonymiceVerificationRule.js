const logger = require("../utils/logger");
const getProvider = require("../web3/provider");
const { Contract } = require("ethers");
const discordBot = require("../discordBot");

/**
 * Anonymice specific Verification Rule - checks whether users should be assigned Genesis Mice, Baby Mice and
 * Alpha Mice roles based on their holdings. Checks for Mice held in the Users wallet, staked for CHEETH
 * or incubating babies in the breeding process.
 */
class AnonymiceVerificationRule {
  constructor(config) {
    this.config = config;
    this.logger = require("../utils/logger");
  }

  async execute(discordUser, role, result) {
    try {

//  note:   this rule is customized to allow for more than one role assignment so we
//          can ignore the fact that no specific role has been passed in

      let guild = discordBot.getGuild();

      let executionResults = [];

      let qualifiesForGenesisRole =
        result.mice.length > 0 ||
        result.cheethGrinding.length > 0 ||
        result.breeding.length > 0;

      await this.manageRoles(
        "Genesis Mice", //role name
        discordUser, // discord user
        guild, //guild instance
        qualifiesForGenesisRole
      );
      executionResults.push({
        role: "Genesis Mice",
        qualified: qualifiesForGenesisRole,
        result: {
          mice: result.mice,
          staking: result.cheethGrinding,
          breeding: result.breeding
        },
      });

      let qualifiesForBabyRole = result.babies.length > 0;

      await this.manageRoles(
        "Baby Mice",
        discordUser,
        guild,
        qualifiesForBabyRole
      );

    
      executionResults.push({
        role: "Baby Mice",
        qualified: qualifiesForBabyRole,
        result: result.babies,
      });

      let qualifiesForAlphaMice = qualifiesForGenesisRole || qualifiesForBabyRole;
      await this.manageRoles(
        "Alpha Mice",
        discordUser,
        guild,
        qualifiesForAlphaMice
      );

      executionResults.push({
        role: "Alpha Mice",
        qualified: qualifiesForAlphaMice,
        result: {
          mice:  {
            mice: result.mice,
            staking: result.cheethGrinding,
            breeding: result.breeding
          },
          babies: {
            babies: result.babies
          }   
        }
      });

      return executionResults;

    } catch (err) {
      logger.error(err.message);
    }
  }

  async check(user) {
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

    return result.map((r) => r.toNumber());
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

  //todo: cleanup return values arent consumed
  
  async manageRoles(roleName, discordUser, guild, qualifies) {
    let roleDefinition = this.config.roles.filter((r) => r.name == roleName);
    if (!roleDefinition) {
      this.logger.error(
        `Could not find the role id configured for ${roleName}. Please confirm your configuration.`
      );
      return false;
    }
    let roleId = roleDefinition[0].id;
    let role = await guild.roles.fetch(roleId);
    if (!role) {
      this.logger.error(
        `Could not locate the ${roleName} discord role using id ${roleId} specified. Please confirm your configuration.`
      );
      return false;
    }

    if (qualifies) {
      if (!discordUser.roles.cache.has(roleId)) {
        logger.info(`Assigning Role: ${roleName}`);
        await discordUser.roles.add(role);
      }
      return true;
    } else {
      if (discordUser.roles.cache.has(role)) {
        logger.info(`Removing Role: ${roleName}`);
        await discordUser.roles.remove(role);
      }
      return false;
    }
  }
}

module.exports = AnonymiceVerificationRule;
