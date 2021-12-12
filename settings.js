/*##############################################################################
# File: settings.js                                                            #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

const AnonymiceABI = require("./src/contracts/mice_abi.json");
const CheethABI = require("./src/contracts/cheeth_abi.json");
const AnonymiceBreedingABI = require("./src/contracts/baby_mice_abi.json");

const settings = {
  endpointUrl: "https://mainnet.infura.io/v3/d6510b4c124e4aea86eb01bce2b31f82",
  rules: [
    {
      name: "Baby Mice",
      roleId: "917471252518666290",
      executor: {
        type: "GenericContractVerificationRule.js",
        config: {
          contractAddress: "0x15cc16bfe6fac624247490aa29b6d632be549f00",
          contractAbi: AnonymiceBreedingABI,
          method: "balanceOf",
        },
      },
    },
    {
      name: "Genesis Mice",
      roleId: "917471303554957392",
      executor: {
        type: "GenesisMouseVerificationRule.js",
        config: {
          AnonymiceContract: {
            Address: "0xC7492fDE60f2eA4DBa3d7660e9B6F651b2841f00",
            ABI: AnonymiceABI,
          },
          CheethContract: {
            Address: "0x5f7BA84c7984Aa5ef329B66E313498F0aEd6d23A",
            ABI: CheethABI,
          },
          AnonymiceBreedingContract: {
            Address: "0x15cc16bfe6fac624247490aa29b6d632be549f00",
            ABI: AnonymiceBreedingABI,
          },
        },
      },
    },
  ],
};

module.exports = settings;
