/*##############################################################################
# File: discordBot.js                                                          #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

const config = require("./config");
const logger = require("./utils/logger");
const fs = require("fs");
const path = require("path");
const { Client, Intents } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

//register all discord command handlers defined in discordBot/commandHandlers directory
const commandHandlerDir = path.join(__dirname, "./discordBot/commandHandlers");
const commandHandlerFiles = fs
  .readdirSync(commandHandlerDir)
  .filter((file) => file.endsWith(".js"));
const commandHandlers = [];
commandHandlerFiles.forEach((f) => {
  commandHandlers.push(require(path.join(commandHandlerDir, f)));
});

/**
 * Provides a lightweight wrapper around discordjs
 * - Automatically registers any commandHandlers found in ./discordBot/commandHandlers
 * - Forwards calls to the appropriate commandHandler based on received interactions
 */
class DiscordBot {
  constructor() {
    this.webServerConfig = config.application.server;
    this.config = config.discord;

    //discord client
    this.client = new Client({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
    });
  }

  /**
   * Retreives the Discord instance as defined in .env variable DISCORD_GUILD_ID
   * @returns Discord Guild
   */
  getGuild() {
    return this.client.guilds.cache.get(this.config.guildId);
  }

  /**
   * Starts the Discord Bot and adds an event listener for `interactionCreate`
   * events.
   *
   * When an `interactionCreate` event is received, forwards the event to an
   * appropriate `commandHandler`. If no `commandHandler` supporting the
   * interaction is found, ignores the interaction.
   */
  async start() {
    //discord bot rest configuration
    new REST({ version: "9" })
      .setToken(this.config.botToken)
      .put(
        Routes.applicationGuildCommands(
          this.config.clientId,
          this.config.guildId
        ),
        {
          body: commandHandlers
            .map((c) => c.getCommand())
            .map((c) => c.toJSON()),
        }
      )
      .then(() => {
        commandHandlers.forEach((command) => {
          let slashCommand = command.getCommand();
          logger.info(
            `Successfully registered command: '/${slashCommand.name}' | Description: '${slashCommand.description}'`
          );
        });
        logger.info("Done registering application commands.");
      })
      .catch(console.error);

    await this.client.login(this.config.botToken);

    this.client.once("ready", () => {
      logger.info("Discord Bot Ready!");
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;
      const commandHandler = commandHandlers.find(
        (handler) => handler.getCommand().name === interaction.commandName
      );

      if (!commandHandler) return;

      await commandHandler.handle(interaction);
    });

    // Info message for people who use the wrong command
    this.client.on("messageCreate", async (message) => {
      if (message.author.bot) return;
      if (
        message.content.startsWith("!verify") ||
        message.content.startsWith("/verify") ||
        message.content.startsWith("!join")
      ) {
        await message.reply("To verify your Mice, please type: **/join**");
      }
    });
  }

  /**
   * Disconnects the Discord Bot from the Discord API
   */
  stop() {
    this.client.destroy();
  }
}

module.exports = new DiscordBot();
