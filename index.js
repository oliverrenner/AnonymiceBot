const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const generateNonce = require('./signature_provider');

const Discord = require('discord.js');
const {Intents} = require("discord.js");
const {
    DISCORD_BOT_TOKEN,
    VERIFICATION_COMMAND,
    VERIFICATION_PORT,
    VERICICATION_BASE_URL,
    VERIFICATION_TIMEOUT_MINUTES,
    SESSION_SECRET,
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
    session({ secret: SESSION_SECRET, cookie: { maxAge: 60000 }}),
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

app.get('/api/nonce', async (req, res) => {
    req.session.nonce = generateNonce();
    req.session.save(() => res.status(200).send(req.session.nonce).end());
});

app.post('/api/sign_in', async (req, res) => {
    try {
        const { ens } = req.body;
        if (!req.body) {
          res.status(422).json({ message: "Expected signMessage object as body." });
          return;
        }
    
        const message = req.body;
    
        //todo: 
        //  - add ethers
        //  - infura
        //  - verify signed message

        //todo: infura connection

        // const infuraProvider = new providers.JsonRpcProvider(
        //   {
        //     allowGzip: true,
        //     url: `${getInfuraUrl(
        //       message.chainId
        //     )}/8fcacee838e04f31b6ec145eb98879c8`,
        //     headers: {
        //       Accept: "*/*",
        //       Origin: `http://localhost:${PORT}`,
        //       "Accept-Encoding": "gzip, deflate, br",
        //       "Content-Type": "application/json",
        //     },
        //   },
        //   Number.parseInt(message.chainId)
        // );
    
        // await infuraProvider.ready;
    }
        //todo: verify signature server side
        //const fields = await message.validate(infuraProvider);
    catch(err) {
        console.error(err)
    }
    finally {
        console.log('done.')
    }
    

    res.status(200)
    .json({
        text: '',
        address: '',
        ens: '',
    })
    .end();
    return;
  
});


const getInfuraUrl = (chainId) => {
    switch (Number.parseInt(chainId)) {
        case 1:
            return 'https://mainnet.infura.io/v3';
        case 3:
            return 'https://ropsten.infura.io/v3';
        case 4:
            return 'https://rinkeby.infura.io/v3';
        case 5:
            return 'https://goerli.infura.io/v3';
        case 137:
            return 'https://polygon-mainnet.infura.io/v3';
    }
};


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

const port = VERIFICATION_PORT;
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
