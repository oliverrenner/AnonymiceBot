class Syncronizer {
  

  start() {
    // re-verify roles
    this.interval = setInterval(async () => {
      const today = new Date();
      const yesterday = new Date().setDate(new Date().getDate() - 1);
      const usersToReverify = await User.find({
        lastVerified: { $lte: yesterday },
      }).exec();

      const guild = client.getGuild(process.env.DISCORD_GUILD_ID);

      usersToReverify.forEach(async (user) => {
        const discordUser = await guild.members.fetch(user.userId);
        //if the user isnt in the discord anymore, remove them
        if (!discordUser) {
          await User.deleteOne({ userId: user.userId }).exec();
        } else {
          // add or revoke roles of user
          const status = await manageRolesOfUser(guild, discordUser, {
            chainId: 1, //todo: configurable?
            address: user.walletAddress,
          });
          user.lastVerified = today.getTime();
          user.status = status;
          user.save();
        }
      });
    }, 24 * 60 * 60 * 1000); // daily
  }

  stop() {
    if(this.interval) {
      clearInterval(this.interval);
    }
  }
}

module.exports = new Syncronizer();
