/*##############################################################################
# File: VerificationRequestCommandHandler.js                                   #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

const config = require("../../config");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow, MessageButton } = require("discord.js");

const uuid = require("uuid");
const VerificationRequest = require("../../db/models/verificationRequest");

const VERIFICATION_COMMAND = "join";
const VERIFICATION_COMMAND_DESCRIPTION =
  "Verify your Mice and receive channel access!";

class VerificationRequestCommandHandler {
  constructor() {
    this.slashCommand = new SlashCommandBuilder()
      .setName(VERIFICATION_COMMAND)
      .setDescription(VERIFICATION_COMMAND_DESCRIPTION);
  }

  /* helper to retrieve the underlying discord slash command instance */
  getCommand() {
    return this.slashCommand;
  }
  /* ---------------------------------------------------------------- */

  /* implementation */
  async handle(interaction) {
    const requestId = uuid.v4();

    //use private url when running in dev mode
    let baseUrl = process.env.NODE_ENV === "production" ? config.application.server.publicUrl : config.application.server.privateUrl;

    //create a verification request based on the user interaction
    const verificationRequest = {
      userId: interaction.user.id,
      requestId,
      url: `${baseUrl}/signin?requestId=${requestId}`,
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
      content: "To verify your Mice, please sign a message using your wallet!",
      components: [row],
      ephemeral: true,
    });
  }
}

module.exports = new VerificationRequestCommandHandler();
