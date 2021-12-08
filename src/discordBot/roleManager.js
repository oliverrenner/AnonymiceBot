const {
  getBabyMice,
  getAdultMice,
  getCheethGrindingMice,
  getBreedingMice,
} = require("../web3scripts");
const {discord} = require("./../config");
const logger = require("../utils/logger");

// add or remove role from user
const assignOrRevokeRole = (assign, role, discordUser) => {
  if (!role || !discordUser) {
    logger.info("Role or User doesen't exist.");
    return null;
  }
  if (assign) {
    discordUser.roles.add(role);
    return role;
  } else {
    discordUser.roles.remove(role);
    return null;
  }
};

// fetch all relevant on-chain information and deduce required roles for user
const manageRolesOfUser = async (guild, discordUser, message) => {
  // roles
  logger.info('discord config', discord);
  const babyMiceRole = guild.roles.cache.find((r) => r.id === discord.roleIdBabyMouse);
  const adultMiceRole = guild.roles.cache.find((r) => r.id === discord.roleIdGenesisMouse);

  logger.info('babyMiceRole', babyMiceRole);
  logger.info('adultMiceRole', adultMiceRole);

  // tokens owned by message.address
  const babyMice = await getBabyMice(message);
  const adultMice = await getAdultMice(message);
  const cheethGridingMice = await getCheethGrindingMice(message);
  const breedingMice = await getBreedingMice(message);

  const roles = [];
  // assign or revoke roles
  roles.push(assignOrRevokeRole(babyMice.length > 0, babyMiceRole, discordUser));
  roles.push(assignOrRevokeRole(
    adultMice.length > 0 ||
      cheethGridingMice.length > 0 ||
      breedingMice.length > 0,
    adultMiceRole,
    discordUser
  ));

  return {
    babyMice: babyMice,
    adultMice: adultMice,
    cheethGridingMice: cheethGridingMice,
    breedingMice: breedingMice,
    roles: roles.filter(r => !!r).map(r => r.name)
  }
};

module.exports = { assignOrRevokeRole, manageRolesOfUser };
