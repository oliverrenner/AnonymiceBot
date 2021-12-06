const {
  Client,
  Intents,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const uuid = require("uuid");
const VerificationRequest = require("../db/models/verificationRequest");
const { VERIFICATION_COMMAND, VERICICATION_BASE_URL } = require("../variables");
require("dotenv").config();

//discord bot rest api's supported
const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_BOT_TOKEN);

//discord client
const client = new Client({
  intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS],
});

class DiscordClient {
  constructor() {
    let commands = [
      new SlashCommandBuilder()
        .setName(VERIFICATION_COMMAND)
        .setDescription("Verify your Mice and receive channel access!"),
    ].map((command) => command.toJSON());

    rest
      .put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID,
          process.env.DISCORD_GUILD_ID
        ),
        { body: commands }
      )
      .then(() => console.log("Successfully registered application commands."))
      .catch(console.error);

    //configure discord bot

    client.once("ready", () => {
      console.log("Discord Bot Ready!");
    });

    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;
      if (interaction.commandName !== VERIFICATION_COMMAND) return;

      const requestId = uuid.v4();

      //create a verification request based on the user interaction
      const verificationRequest = {
        userId: interaction.user.id,
        requestId,
        url: VERICICATION_BASE_URL + "?requestId=" + requestId,
        ts: new Date().getTime(),
        completed: false,
      };

      //record the verification request in the db
      const verificationRequesRecord = new VerificationRequest(
        verificationRequest
      );
      verificationRequesRecord.save();

      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Verify Now!")
          .setURL(verificationRequest.url)
          .setStyle("LINK")
      );

      // send verification link to user
      await interaction.reply({
        content:
          "To verify your Mice, please sign a message using your wallet!",
        components: [row],
        ephemeral: true,
      });
    });
  }

  getGuild(guildId) {
    return client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
  }

  async login(token) {
    return client.login(token);
  }
}

module.exports = DiscordClient;
