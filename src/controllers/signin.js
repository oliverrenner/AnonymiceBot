const logger = require("../utils/logger");
const { verifySignature } = require("../web3scripts");
const VerificationRequest = require("../db/models/verificationRequest");
const User = require("../db/models/user");
const verificationRequestValidator = require("../validators/VerificationRequestValidator");
const DiscordBot = require("../discordBot");
const { manageRolesOfUser } = require("../discordBot/roleManager");


class SignInController {
  async post(req, res) {
    const message = req.body;

    if (!message) {
      throw new RequestError({
        statusCode: 422,
        message: "Could not process the sign in request.",
      });
    }

    //retrieve original verification request from db
    const verificationRequestRecord = await VerificationRequest.findOne({
      requestId: message.nonce,
    }).exec();

    //validate the verification request record
    verificationRequestValidator.validate(verificationRequestRecord);

    // verify signature through infura node
    const signatureVerified = await verifySignature(message);

    logger.info("signature verification result: " + signatureVerified);

    if (!signatureVerified) {
      // signature could not be verified, abort mission
      res.status(422).json({ message: "Could not verify signature." }).end();
      return;
    }

    const guild = DiscordBot.getGuild(process.env.DISCORD_GUILD_ID);
    const discordUser = guild.members.fetch(
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

    logger.info("successfully assigned roles to " + discordUser.displayName);

    // return something to frontend .. we're done here
    res
      .status(200)
      .json({
        status,
      })
      .end();
  }
}

module.exports = new SignInController();
