const {
  getBabyMice,
  getAdultMice,
  getCheethGrindingMice,
  getBreedingMice,
  getCheeth,
} = require("../web3scripts");

// add or remove role from user
const assignOrRevokeRole = (assign, role, discordUser) => {
  if (!role || !discordUser) {
    console.log("Role or User doesen't exist.");
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
  const babyMiceRole = guild.roles.cache.find((r) => r.name === "Baby Mice");
  const adultMiceRole = guild.roles.cache.find((r) => r.name === "Mice");
  const cheethHoarderRole = guild.roles.cache.find(
    (r) => r.name === "Cheeth Hoarder"
  );

  // tokens owned by message.address
  const babyMice = await getBabyMice(message);
  const adultMice = await getAdultMice(message);
  const cheethGridingMice = await getCheethGrindingMice(message);
  const breedingMice = await getBreedingMice(message);
  const isCheethHoarder = await getCheeth(message);

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
  roles.push(assignOrRevokeRole(isCheethHoarder, cheethHoarderRole, discordUser));

  return {
    babyMice: babyMice,
    adultMice: adultMice,
    cheethGridingMice: cheethGridingMice,
    breedingMice: breedingMice,
    isCheethHoarder: isCheethHoarder,
    roles: roles.filter(r => !!r).map(r => r.name)
  }
};

module.exports = { assignOrRevokeRole, manageRolesOfUser };
