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
      
      let executionResults = [];

      let discordRoles = await this.getDiscordRoles(this.config.roles)
      
      //genesis mice
      let genesisMiceRoleConfig = this.config.roles.find(r => r.name === "Genesis Mice");
      let genesisMiceRole = discordRoles.find(r => r.id === genesisMiceRoleConfig.id);
      let qualifiesForGenesisRole =
        result.mice.length > 0 ||
        result.cheethGrinding.length > 0 ||
        result.breeding.length > 0;
      await this.manageRoles(
        discordUser, // discord user
        genesisMiceRole, //guild instance
        qualifiesForGenesisRole
      );
      executionResults.push({
        role: "Genesis Mice",
        roleId: genesisMiceRole.id,
        qualified: qualifiesForGenesisRole,
        result: {
          mice: result.mice,
          staking: result.cheethGrinding,
          breeding: result.breeding,
        },
      });


      //baby mice
      let babyMiceRoleConfig = this.config.roles.find(r => r.name === "Baby Mice");
      let babyMiceRole = discordRoles.find(r => r.id === babyMiceRoleConfig.id);
      let qualifiesForBabyRole = result.babies.length > 0;
      await this.manageRoles(
        discordUser,
        babyMiceRole,
        qualifiesForBabyRole
      );
      executionResults.push({
        role: "Baby Mice",
        roleId: babyMiceRole.id,
        qualified: qualifiesForBabyRole,
        result: result.babies,
      });


      //alpha mice 
      let alphaMiceRoleConfig = this.config.roles.find(r => r.name === "Alpha Mice");
      let alphaMiceRole = discordRoles.find(r => r.id === alphaMiceRoleConfig.id);
      let qualifiesForAlphaMice =
        qualifiesForGenesisRole || qualifiesForBabyRole;
      await this.manageRoles(
        discordUser,
        alphaMiceRole,
        qualifiesForAlphaMice
      );

      executionResults.push({
        role: "Alpha Mice",
        roleId: alphaMiceRole.id,
        qualified: qualifiesForAlphaMice,
        result: {
          mice: {
            mice: result.mice,
            staking: result.cheethGrinding,
            breeding: result.breeding,
          },
          babies: {
            babies: result.babies,
          },
        },
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

  async getDiscordRoles(rolesConfig) {
    let guild = discordBot.getGuild();
    let roles = [];
    //retrieve each of the discord roles defined in the config
    await rolesConfig.forEach(async (r) => {
      let role = await guild.roles.fetch(r.id);
      if (!role) {
        this.logger.error(
          `Could not find the role id configured for ${r.name}. Please confirm your configuration.`
        );
        return;
      }
      roles.push(role);
    });

    return roles;
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

  async manageRoles(discordUser, role, qualifies) {
    if (!role) {
      this.logger.error(
        `Could not locate the ${roleName} discord role using id ${roleId} specified. Please confirm your configuration.`
      );
      return false;
    }

    if (qualifies) {
      if (!discordUser.roles.cache.has(role.id)) {
        logger.info(`Assigning Role: ${role.name}`);
        await discordUser.roles.add(role);
      }
      return true;
    } else {
      if (discordUser.roles.cache.has(role.id)) {
        logger.info(`Removing Role: ${role.name}`);
        await discordUser.roles.remove(role);
      }
      return false;
    }
  }
}

module.exports = AnonymiceVerificationRule;
