/*##############################################################################
# File: signinApiController.js                                                 #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

const logger = require("../utils/logger");
const RequestError = require("../utils/RequestError");
const VerifySignature = require("../web3/signature");
const verificationRequestValidator = require("../validators/VerificationRequestValidator");
const VerificationRequest = require("../db/models/verificationRequest");
const User = require("../db/models/user");
const ruleExecutor = require("../rules/RuleExecutor");
const userCleanupService = require("../services/userCleanupService");

class SignInApiController {
  //processes requests for sign in using web 3
  async post(req, res) {
    const message = req.body;

    if (!message) {
      throw new RequestError({
        statusCode: 422,
        message: "Could not process the sign in request.",
      });
    }

    //retrieve original verification request record which was provided to
    //the user on the sign in page
    const verificationRequestRecord = await VerificationRequest.findOne({
      requestId: message.nonce,
    }).exec();

    //validate the verification request record
    const validationResult = verificationRequestValidator.validate(
      verificationRequestRecord
    );

    if (!validationResult.isValid()) {
      logger.error(
        `Verification requestId ${
          verificationRequestRecord.requestId
        } from wallet: ${message.address} failed.
        Validation Error: ${validationResult.getErrorMessage()}`
      );

      throw new RequestError(400, validationResult.getErrorMessage());
    }

    //verify the users signature
    await this.verifySignature(message);

    //retrive the first user db record found tied to the wallet address 
    //of the signer or a new user record if none exists
    const user = await this.getUser(message.address);
    //assign the user record the discord user id from the verification record
    user.userId = verificationRequestRecord.userId;
    //assign the user record the wallet address used in signing
    user.walletAddress = message.address;
    user.lastVerified = verificationRequestRecord.ts;

    //execute the configured verification rules
    const status = await ruleExecutor.run(user);

    //mark verification request complete
    verificationRequestRecord.completed = true;
    verificationRequestRecord.save();

    //assign the user record the status result from the verification process
    if(!status || status.length <= 0) {
      this.logger.error(`Rule execution returned an empty result. User will not be saved and must initiate another verification request. ${user}`);
    }
    else {
      user.status = status;
      user.save();
  
      //clean the user database - see the cleanup method for more details
      await userCleanupService.cleanup(user, ruleExecutor, logger);
    }

    // return something to frontend .. we're done here
    res
      .status(200)
      .json({
        status,
      })
      .end();
  }

  async getUser(walletAddress) {
    const user = await User.findOne({
      walletAddress: { $regex: walletAddress, $options: "i" },
    }).exec();
    return user || new User();
  }

  async verifySignature(message) {
    //verify web 3 signature
    const signatureVerified = await VerifySignature(message);

    if (!signatureVerified) {
      logger.error(
        `Signature verification from wallet: ${message.address} failed.`
      );
      // signature could not be verified, abort mission
      res.status(422).json({ message: "Could not verify signature." }).end();
      return;
    }
  }
}

module.exports = new SignInApiController();
