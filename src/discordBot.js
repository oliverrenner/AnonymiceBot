const config = require("./config");
const logger = require("./utils/logger");
const { Client, Intents } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

//todo: dynamically load all commands from commands dir
const VerificationRequestCommand = require("./discordBot/commands/VerificationRequestCommand");

class DiscordBot {
  constructor() {
    this.webServerConfig = config.application.server;
    this.config = config.discord;

    //discord client
    this.client = new Client({
      intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS],
    });

    this.discordBotCommands = [new VerificationRequestCommand({
      webServerPublicUrl: this.webServerConfig.publicUrl,
      verificationPage: this.config.commands.verification.page
    })];

    //discord bot rest configuration
    const rest = new REST({ version: "9" });

    rest
      .setToken(this.config.botToken)
      .put(Routes.applicationGuildCommands(this.config.clientId, this.config.guildId), {
        body: this.discordBotCommands
          .map((c) => c.getCommand())
          .map((c) => c.toJSON()),
      })
      .then(() => {
        this.discordBotCommands.forEach((command) => {
          let slashCommand = command.getCommand();
          logger.info(
            `Successfully registered command: '/${slashCommand.name}' | Description: '${slashCommand.description}'`
          );
        });
        logger.info("Done registering application commands.");
      })
      .catch(console.error);
  }

  getGuild() {
    return this.client.guilds.cache.get(this.config.guildId);
  }

  async start() {
    await this.client.login(this.config.botToken);

    this.client.once("ready", () => {
      logger.info("Discord Bot Ready!");
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;
      const commandHandler = this.discordBotCommands.find(
          (handler) => handler.getCommand().name === interaction.commandName
      );
      if (!commandHandler) return;
      await commandHandler.handle(interaction);
    });

    // Info message for people who use the wrong command
    this.client.on('messageCreate', async message => {
      if (message.author.bot) return;
      if (message.content.startsWith("!verify") || message.content.startsWith("/verify") || message.content.startsWith("!join")) {
        await message.reply("To verify your Mice, please type: **/join**");
      }
    });
  }

  stop() {
    this.client.destroy();
  }
}

module.exports = new DiscordBot();
