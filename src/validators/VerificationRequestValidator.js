const config = require("../config");
const errorMessages = {
  badRequestMessage: "Sorry. We cannot process your verification request.",
  expiredRequestIdMessage:
    "Invalid request, maybe it expired (timeout = " +
    config.signin.verificationTimeoutInNumberOfMinutes +
    "min).",
  completedRequestIdMessage:
    "This verification has already been used.",
};

class VerificationRequestValidator {
  validate(verificationRequest) {
    if (!verificationRequest) {
      return new ValidationResult(errorMessages.badRequestMessage);
    }

    if (this.isExpired(verificationRequest)) {
      return new ValidationResult(errorMessages.expiredRequestIdMessage);
    }

    if (this.isCompleted(verificationRequest)) {
      return new ValidationResult(errorMessages.completedRequestIdMessage);
    }

    return new ValidationResult();
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

  getBadRequestErrorMessage() {
    return errorMessages.badRequestMessage;
  }
}

class ValidationResult {
  constructor(errorMessage) {
    this.errorMessage = errorMessage;
  }

  isValid() {
    let hasError = this.errorMessage && this.errorMessage.length
    return !hasError;
  }
  getErrorMessage() {
    return this.errorMessage;
  }
}

module.exports = new VerificationRequestValidator();
