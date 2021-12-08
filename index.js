const config = require("./src/config");
const logger = require("./src/utils/logger");
const mongoose = require("mongoose");
const app = require("./src/app");
const DiscordBot = require("./src/discordBot");
const Syncronizer = require("./src/syncronizer");


let server, bot, sync;

mongoose.connect(config.mongodb.url, config.mongoose.options).then(() => {

  logger.info("Connected to MongoDB");

  //start the web server
  server = app.listen(config.application.port, () => {
    logger.info(
      `${config.application.name} is running at port ${config.application.port}`
    );
  });

  //todo: migrate to another node hosting script
  //start the discord bot
  DiscordBot.start();  

  //todo: migrate to another node hosting script
  //start the daily role verification sync process
  Syncronizer.start();

});

//todo: deprecate once other services are moved to another node hosting script
const stopServices = (shouldLog) => {
  if(server) {
    server.close();
    logger.info("Server closed");
  }
  if(bot) {
    bot.stop();
    logger.info("Discord Client closed");
  }
  if(syncronizer) {
    syncronizer.stop();
    logger.info("Syncronizer stopped");
  }
}

const exitHandler = () => {
  stopServices(true);
  process.exit(1);
};

const unexpectedErrorHandler = (error) => {
  logger.error(error.message);
  //exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  stopServices();
});
