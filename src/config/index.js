const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
    path: path.join(__dirname, '../.env')
});

dotenv.config();


const application = {
    name: process.env.APPLICATION_NAME,
    port: process.env.APPLICATION_SERVER_PORT,
    server: {
        scheme: process.env.APPLICATION_SERVER_SCHEME,
        host: process.env.APPLICATION_SERVER_HOST,
        port: process.env.APPLICATION_SERVER_PORT,
        publicUrl: process.env.PUBLIC_URL,
    },
}

const discord = {
    botToken: process.env.DISCORD_BOT_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID,
    commands: {
        verification: {
            page: process.env.DISCORD_COMMANDS_VERIFICATION_PAGE
        }
    }
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


module.exports = {
    application,
    mongodb,
    mongoose,
    signin,
    discord,
}
