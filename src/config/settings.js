/*##############################################################################
# File: settings.js                                                            #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

const AnonymiceABI = require("../contracts/mice_abi.json");
const CheethABI = require("../contracts/cheeth_abi.json");
const AnonymiceBreedingABI = require("../contracts/baby_mice_abi.json");

const settings = {
  rules: [
    //example of a generic/standard verification rule
    //checks whether the signers wallet holds at least 1 
    //token from the specified contract
    // {
    //   name: "Baby Mice",
    //   roleId: "918771367074201631",
    //   executor: {
    //     type: "GenericContractVerificationRule.js",
    //     config: {
    //       contractAddress: "0x15cc16bfe6fac624247490aa29b6d632be549f00",
    //       contractAbi: AnonymiceBreedingABI,
    //       method: "balanceOf",
    //     },
    //   },
    // },
    // completely customized verification rule
    {
      name: "Anonymice Verifier",
      executor: {
        type: "AnonymiceVerificationRule.js",
        config: {
          roles: [
            {
              name: "Genesis Mice",
              id: "918771246651572266"
            },
            {
              name: "Baby Mice",
              id: "918771367074201631"
            },
            {
              name: "Alpha Mice",
              id: "917141311100964915"
            }
          ],
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
          }
        },
      },
    },
  ],
};

module.exports = settings;
