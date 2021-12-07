const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const { verifySignature } = require("./app/web3scripts");
const { manageRolesOfUser } = require("./app/discord/roleManager");

const mongoose = require("mongoose");
const VerificationRequest = require("./app/db/models/verificationRequest");
const User = require("./app/db/models/user");

const {
  VERIFICATION_PORT,
  VERIFICATION_TIMEOUT_MINUTES,
} = require("./app/variables");
//load env vars
require("dotenv").config();

const DiscordClient = require("./app/discord/client");
const client = new DiscordClient();
client.login(process.env.DISCORD_BOT_TOKEN);

const app = express();
app.use([
  express.json(),
  cors(),
  helmet(),
  bodyParser.json(),
  bodyParser.urlencoded({ extended: false }),
]);
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// health check endpoint for node server
app.get("/status", [
  (req, res) => {
    return res.send("Health Check: 200! Ok");
  },
]);

// serves the verification html page
app.get("/verification-page", function (request, response) {
  //todo: generateNonce here and insert in response directly
  response.sendFile("./app/views/verification-page.html", { root: "." });
});

app.post("/api/sign_in", async (req, res) => {
  try {
    const message = req.body;

    if (!message) {
      // no message no verification
      res
        .status(422)
        .json({ message: "Expected signMessage object as body." })
        .end();
      return;
    }

    //retrieve original verification request from db
    const verificationRequestRecord = await VerificationRequest.findOne({
      requestId: message.nonce,
    }).exec();

    //no verification request found
    if (!verificationRequestRecord) {
      return res
        .status(422)
        .json({ message: "Could not locate the requestId." })
        .end();
    }

    //verification request expired
    if (isExpired(verificationRequestRecord)) {
      return res
        .status(422)
        .json({
          message:
            "Invalid request, maybe it expired (timeout = " +
            VERIFICATION_TIMEOUT_MINUTES +
            "min). Please generate a new request in Discord.",
        })
        .end();
    }

    //verification request already used
    if (isCompleted(verificationRequestRecord)) {
      return res
        .status(422)
        .json({
          message:
            "This verification has already been used, please create a new one!",
        })
        .end();
    }

    if (verificationRequestRecord) {
      // verify signature through infura node
      const signatureVerified = await verifySignature(message);

      console.log("signature verification result: " + signatureVerified);

      if (!signatureVerified) {
        // signature could not be verified, abort mission
        res.status(422).json({ message: "Could not verify signature." }).end();
        return;
      }

      const guild = client.getGuild(process.env.DISCORD_GUILD_ID);
      const discordUser = guild.members.cache.get(
        verificationRequestRecord.userId
      );

      // add or revoke roles of user
      const status = await manageRolesOfUser(guild, discordUser, message);

      //mark verification request complete
      verificationRequestRecord.completed = true;
      verificationRequestRecord.save();

      //prefer the signing wallet address to locate an existing user account
      //fallback to the discord user Id
      //fallback to a new user
      const existingUserByWallet = await User.findOne({
        walletAddress: message.address,
      }).exec();
      const existingUserByDiscordUserId = await User.findOne({
        userId: verificationRequestRecord.userId,
      }).exec();
      const existingUser = existingUserByWallet || existingUserByDiscordUserId;
      const user = existingUser || new User();
      user.userId = verificationRequestRecord.userId;
      user.walletAddress = message.address;
      user.lastVerified = verificationRequestRecord.ts; //setting the last time user signed
      user.status = status;
      user.save();

      console.info("successfully assigned roles to " + discordUser.displayName);

      // return something to frontend .. we're done here
      res
        .status(200)
        .json({
          status,
        })
        .end();
    } else {
      // no verification request, probably expired
      res
        .status(422)
        .json({
          message:
            "Invalid request, maybe it expired (timeout = " +
            VERIFICATION_TIMEOUT_MINUTES +
            "min). Please generate a new request in Discord.",
        })
        .end();
    }
  } catch (err) {
    console.error(err);
    res.status(422).json({ message: "Ooops, something went wrong!" }).end();
  }
});

mongoose
  .connect(
    `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/${process.env.MONGODB_DBNAME}?authSource=admin`,
    {
      useNewUrlParser: true,
    }
  )
  .then(() => {
    app.listen(VERIFICATION_PORT, () => {
      console.log(
        "AnonymiceDiscordBot is running at port " + VERIFICATION_PORT
      );

      // re-verify roles
      setInterval(async () => {
        const today = new Date();
        const yesterday = new Date().setDate(new Date().getDate() - 1);
        const usersToReverify = await User.find({
          lastVerified: { $lte: yesterday },
        }).exec();

        const guild = client.getGuild(process.env.DISCORD_GUILD_ID);

        usersToReverify.forEach(async (user) => {
          const discordUser = await guild.members.fetch(user.userId);
          //if the user isnt in the discord anymore, remove them
          if (!discordUser) {
            await User.deleteOne({ userId: user.userId }).exec();
          } else {
            // add or revoke roles of user
            const status = await manageRolesOfUser(guild, discordUser, {
              chainId: 1, //todo: configurable?
              address: user.walletAddress,
            });
            user.lastVerified = today.getTime();
            user.status = status;
            user.save();
          }
        });
      }, 24 * 60 * 60 * 1000); // daily
    });
  });

const isExpired = (verificationRequest) => {
  let expired =
    verificationRequest.ts <
    new Date().getTime() - VERIFICATION_TIMEOUT_MINUTES * 60 * 1000;
  return expired;
};

const isCompleted = (verificationRequest) => {
  return verificationRequest.completed === true;
};

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});
