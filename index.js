const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const Discord = require('discord.js');
const {Intents} = require("discord.js");
const {
    DISCORD_BOT_TOKEN,
    DISCORD_SERVER_ID,
    VERIFICATION_COMMAND,
    VERIFICATION_PORT,
    VERICICATION_BASE_URL,
    VERIFICATION_TIMEOUT_MINUTES,
    SESSION_SECRET,
} = require("./variables");
const uuid = require('uuid');
const {
    verifySignature,
    getBabyMice,
    getAdultMice,
    getCheethGrindingMice,
    getBreedingMice,
    getCheethHoarder
} = require("./web3scripts");

const client = new Discord.Client({intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS]});
let outstandingVerifications = [];

client.on('ready', () => {
    console.log(`Discord Bot Logged in...`);
});

client.on('messageCreate', async message => {
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
    await message.author.send("Please follow this link and verify your Account by signing a message: " + verificationRequest.url);
    await message.reply("Please check your DMs, you received instructions to verify your account!");

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
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// health check endpoint for node server
app.get('/status', [(req, res) => {
    return res.send('Health Check: 200! Ok');
}])

// serves the verification html page
app.get('/verification-page', function (request, response) {
    //todo: generateNonce here and insert in response directly
    response.sendFile('verification-page.html', {root: '.'});
});

// add or remove role from user
const assignOrRevokeRole = (assign, role, discordUser) => {
    if (!role || !discordUser) {
        console.log("Role or User doesen't exist.");
        return;
    }
    if (assign) {
        discordUser.roles.add(role);
    } else {
        discordUser.roles.remove(role);
    }
}

// fetch all relevant on-chain information and deduce required roles for user
const manageRolesOfUser = (guild, discordUser, address) => {
    // roles
    const babyMiceRole = guild.roles.cache.find((r) => r.name === "Baby Mice");
    const adultMiceRole = guild.roles.cache.find((r) => r.name === "Mice");
    const cheethHoarderRole = guild.roles.cache.find((r) => r.name === "Cheeth Hoarder");

    // tokens owned by address
    const babyMice = getBabyMice(address);
    const adultMice = getAdultMice(address);
    const cheethGridingMice = getCheethGrindingMice(address);
    const breedingMice = getBreedingMice(address);
    const cheethAmount = getCheethHoarder(address);

    // assign or revoke roles
    assignOrRevokeRole(babyMice.length > 0, babyMiceRole, discordUser);
    assignOrRevokeRole(adultMice.length > 0 || cheethGridingMice.length > 0 || breedingMice.length > 0, adultMiceRole, discordUser);
    assignOrRevokeRole(cheethAmount > 0, cheethHoarderRole, discordUser);
}

app.post('/api/sign_in', async (req, res) => {
    try {
        const message = req.body;

        if (!message) {
            // no message no verification
            res.status(422).json({message: "Expected signMessage object as body."}).end();
            return;
        }

        // grab original verification request from cache
        const verificationRequest = outstandingVerifications.find(r => r.requestId === message.nonce);

        if (verificationRequest) {

            // verify signature through infura node
            const signatureVerified = verifySignature(message);

            console.log("signature verification result: " + signatureVerified);

            if (!signatureVerified) {
                // signature could not be verified, abort mission
                res.status(422).json({message: "Could not verify signature."}).end();
                return;
            }

            const guild = client.guilds.cache.get(DISCORD_SERVER_ID);
            const discordUser = guild.members.cache.get(verificationRequest.userId);

            // add or revoke roles of user
            manageRolesOfUser(guild, discordUser, message);

            // remove completed verification request from cache
            outstandingVerifications = outstandingVerifications.filter(r => r.userId !== verificationRequest.userId);

            // tell user its done!
            await discordUser.send("You are verified. Cheeth!");

            console.info("successfully assigned roles to "+ discordUser.displayName)

            // return something to frontend .. we're done here
            res.status(200)
                .json({
                    text: 'brrt',
                    address: '',
                    ens: '',
                })
                .end();
        } else {
            // no verification request, probably expired
            res.status(422).json({message: "Invalid requestId, maybe it expired (timeout = " + VERIFICATION_TIMEOUT_MINUTES + "min)"}).end();
        }
    } catch (err) {
        console.error(err);
        res.status(422).json({message: "Ooops, something went wrong!"}).end();
    }
});

app.listen(VERIFICATION_PORT, () => {
    console.log('AnonymiceDiscordBot is running at port ' + VERIFICATION_PORT);

    // purge expired requests
    setInterval(() => {
        outstandingVerifications = outstandingVerifications.filter(verificationRequest => {
            let expired = verificationRequest.ts < new Date().getTime() - VERIFICATION_TIMEOUT_MINUTES * 60 * 1000;
            if (expired) {
                console.info("verification request for user " + verificationRequest.userId + " expired after " + VERIFICATION_TIMEOUT_MINUTES + " minutes.");
            }
            return !expired;
        });
    }, 60 * 1000);


    // re-verify roles
    setInterval(() => {
        // TODO: poll internal database and re-verify each user!
    }, 24 * 60 * 60 * 1000); // daily
});
