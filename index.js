const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const helmet = require('helmet')
const Discord = require('discord.js');
const {Intents} = require("discord.js");
const {
    DISCORD_BOT_TOKEN,
    VERIFICATION_COMMAND,
    VERICICATION_BASE_URL,
    VERIFICATION_TIMEOUT_MINUTES
} = require("./variables");
const uuid = require('uuid');

const client = new Discord.Client({intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS]}); // Intents.FLAGS.GUILD_MEMBERS,
let outstandingVerifications = [];

client.on('ready', () => {
    console.log(`Discord Bot Logged in...`);
});

client.on('messageCreate', message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(VERIFICATION_COMMAND)) return;

    // avoid users spamming the server
    outstandingVerifications = outstandingVerifications.filter(verificationRequest => verificationRequest.userId !== message.author.id);

    // create and store verification request
    const requestId = uuid.v4();
    const verificationRequest = {
        requestId,
        url: VERICICATION_BASE_URL + '?requestId=' + requestId,
        userId: message.author.id,
        ts: new Date().getTime()
    }

    // store verification request
    outstandingVerifications.push(verificationRequest);

    // send verification link to user
    message.reply("Please verify your Mice by signing a message: " + verificationRequest.url);

});

client.login(DISCORD_BOT_TOKEN);
const app = express();

app.use([
    express.json(),
    cors(),
    helmet(),
    bodyParser.json(),
    bodyParser.urlencoded({extended: false}),
])

// health check endpoint for node server
app.get('/status', [(req, res) => {
    return res.send('Health Check: 200! Ok');
}])

// serves the verification html page
app.get('/verification-page', function (request, response) {
    response.sendFile('verification-page.html', {root: '.'});
});

// endpoint to be called from the verification page, after client successfully verified
app.get('/verify/:uuid', [(req, res) => {
    const uuid = req.params.uuid;
    return res.send('Received verification request for ' + uuid);

    const verificationRequest = outstandingVerifications.find(r => r.uuid === uuid);

    if (verificationRequest) {
        // verify contracts via infura
        // assign relevant roles to verificationRequest.userId
        // send success DM to user

        // clear all verification requests from user
        outstandingVerifications = outstandingVerifications.filter(verificationRequest => verificationRequest.userId !== message.author.id);
    }
}])

const port = 8080;
app.listen(port, () => {
    console.log('AnonymiceDiscordBot is running at port ' + port);

    // remove expired requests
    setInterval(() => {
        outstandingVerifications = outstandingVerifications.filter(verificationRequest => {
            let expired = verificationRequest.ts < new Date().getTime() - VERIFICATION_TIMEOUT_MINUTES * 60 * 1000;
            if (expired) {
                console.info("verification request for user " + verificationRequest.userId + " expired after " + VERIFICATION_TIMEOUT_MINUTES + " minutes.");
            }
            return !expired;
        });
    }, 5000);
});
