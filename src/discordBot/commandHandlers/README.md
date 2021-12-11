# Anonymice Discord Bot - Command Handlers

To add additional Discord command handlers, simply add a .js file to this directory for each of the commands you would like to handle using the following template.

The Discord Bot will automatically register any commands found in this directory upon start up.

```js

const { SlashCommandBuilder } = require("@discordjs/builders");
const COMMAND = "mycommand";
const COMMAND_DESCRIPTION = "Description of my command";

class MyCommandHandler {
  
  /* ---------------------------------------------------------------- */
  /* boilerplate code - you should not need to edit this */
  constructor() {
    this.slashCommand = new SlashCommandBuilder()
      .setName(COMMAND)
      .setDescription(COMMAND_DESCRIPTION);
  }

  /* helper to retrieve the underlying discord slash command instance */
  getCommand() {
    return this.slashCommand;
  }
  /* ---------------------------------------------------------------- */

  /* my command implementation */
  async handle(interaction) {
    
    // put your implementation for handling the command here //
  }
}

module.exports = new MyCommandHandler();

```