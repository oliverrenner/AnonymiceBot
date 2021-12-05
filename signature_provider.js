const randomizer = require("@stablelib/random");

const generateNonce = () => {
  return (0, randomizer.randomStringForEntropy)(96);
};

module.exports = generateNonce;
