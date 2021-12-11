/*##############################################################################
# File: signinPageController.js                                                #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

const VerificationRequest = require("../db/models/verificationRequest");
const verificationRequestValidator = require("../validators/VerificationRequestValidator");
const viewName = "pages/signin";

class SignInPageController {
  //returns a page with web 3 sign in capability
  async get(req, res) {
    //validate http request
    if (!req.query.requestId) {
      res.render(
        viewName,
        this.toViewModel({ message: verificationRequestValidator.getBadRequestErrorMessage() })
      );
      return;
    }

    //retrieve verification request from db
    const verificationRequestRecord = await VerificationRequest.findOne({
      requestId: req.query.requestId,
    }).exec();

    //validate the verification request record
    const validationResult = verificationRequestValidator.validate(
      verificationRequestRecord
    );

    if (!validationResult.isValid()) {
      res.render(
        viewName,
        this.toViewModel({
          message: validationResult.errorMessage,
        })
      );
      return;
    }
    res.render(viewName);
  }

  //todo: move into a util/helper
  toViewModel(model) {
    return {data: JSON.stringify(model) } ;
  }
}

module.exports = new SignInPageController();
