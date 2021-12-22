/*##############################################################################
# File: index.js                                                               #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
    path: path.join(__dirname, '../../.env')
});

dotenv.config();

const application = {
    name: process.env.APPLICATION_NAME,
    port: process.env.APPLICATION_SERVER_PORT,
    server: {
        scheme: process.env.APPLICATION_SERVER_SCHEME,
        host: process.env.APPLICATION_SERVER_HOST,
        port: process.env.APPLICATION_SERVER_PORT
    },
    publicServer: {
        scheme: process.env.APPLICATION_SERVER_PUBLIC_SCHEME,
        host: process.env.APPLICATION_SERVER_PUBLIC_HOST,
        port: process.env.APPLICATION_SERVER_PUBLIC_PORT
    }
}

const infura = {
    endpointUrl: process.env.INFURA_ENDPOINT + process.env.INFURA_KEY
}

const discord = {
    botToken: process.env.DISCORD_BOT_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID
}

const sync = {
    numberOfMinutes: process.env.SYNC_INTERVAL_IN_MINUTES,
    syncOnStartup: process.env.SYNC_ON_STARTUP
}

const mongodb = {
    url: `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_DBNAME}${process.env.MONGODB_OPTIONS}`
}

const mongoose = {
    options: {
    }
}

const signin = {
    verificationTimeoutInNumberOfMinutes: process.env.DISCORD_VERIFICATION_TIMEOUT_MINUTES
}

//helper to concatenate application.server variables into a single consumable url
const publicUrl = `${application.publicServer.scheme}://${application.publicServer.host}${application.publicServer.port ? ":"+application.publicServer.port : ''}`;
application.server.publicUrl = publicUrl;

const privateUrl = `${application.server.scheme}://${application.server.host}${application.server.port ? ":"+application.server.port : ''}`;
application.server.privateUrl = privateUrl;

const envName = process.env.NODE_ENV;

module.exports = {
    application,
    mongodb,
    mongoose,
    signin,
    discord,
    sync,
    infura,
    envName
}
