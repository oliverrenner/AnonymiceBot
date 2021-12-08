const config = require("../config");
const RequestError = require("../utils/RequestError");
const errorMessages = {
  badRequestMessage: "Could not process the request.",
  couldNotLocateRequestIdMessage: "Could not locate the requestId.",
  expiredRequestIdMessage:
    "Invalid request, maybe it expired (timeout = " +
    config.signin.verificationTimeoutInNumberOfMinutes +
    "min). Please generate a new request in Discord.",
  completedRequestIdMessage:
    "This verification has already been used, please create a new one!",
};

class VerificationRequestValidator {
  validate(verificationRequest) {
    if (!verificationRequest) {
      throw new RequestError(422, errorMessages.badRequestMessage);
    }

    if (this.isExpired(verificationRequest)) {
      throw new RequestError(422, errorMessages.expiredRequestIdMessage);
    }

    if (this.isCompleted(verificationRequest)) {
      throw new RequestError(422, errorMessages.completedRequestIdMessage);
    }
  }

  isExpired(verificationRequest) {
    let expired =
      verificationRequest.ts <
      new Date().getTime() -
        config.signin.verificationTimeoutInNumberOfMinutes * 60 * 1000;
    return expired;
  }

  isCompleted(verificationRequest) {
    return verificationRequest.completed === true;
  }
}

module.exports = new VerificationRequestValidator();
