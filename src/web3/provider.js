/*##############################################################################
# File: provider.js                                                            #
# Project: Anonymice - Discord Bot                                             #
# Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)            #
# © 2021                                                                       #
###############################################################################*/

const config = require("../config");
const { providers } = require("ethers");

const getProvider = async () => {
  let url = config.infura.endpointUrl;
  const infuraProvider = new providers.JsonRpcProvider({
    allowGzip: true,
    url: url,
    headers: {
      Accept: "*/*",
      Origin: config.application.server.host,
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/json",
    },
  });

  await infuraProvider.ready;
  return infuraProvider;
};

module.exports = getProvider;
