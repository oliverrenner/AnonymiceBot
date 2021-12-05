const {sign} = require("simple-statistics");

const verifySignature = (message) => {
    // TODO: verify the signature through infura!

    const infuraProvider = new providers.JsonRpcProvider(
      {
        allowGzip: true,
        url: `${getInfuraUrl(
          message.chainId
        )}/8fcacee838e04f31b6ec145eb98879c8`,
        headers: {
          Accept: "*/*",
          Origin: `http://localhost:${PORT}`,
          "Accept-Encoding": "gzip, deflate, br",
          "Content-Type": "application/json",
        },
      },
      Number.parseInt(message.chainId)
    );

    //await infuraProvider.ready;
    
    //todo: verify signature server side
    //const fields = await message.validate(infuraProvider);

    // clear all verification requests from user

    console.log('verifying message', message);
    return true;
}

const getAdultMice = (address) => {
    // TODO: fetch all adult mice from contract
    console.log('get adult mice for address', address);
    return ['todo'];
}

const getBabyMice = (address) => {
    // TODO: fetch all baby mice from contract
    console.log('get baby mice for address', address);
    return ['todo'];
}

const getCheethGrindingMice = (address) => {
    // TODO: fetch all staked mice from cheeth staking contract
    console.log('get cheeth grinding mice for address', address);
    return ['todo'];
}

const getBreedingMice = (address) => {
    // TODO: fetch all staked mice from breeding contract
    console.log('get breeding mice for address', address);
    return ['todo'];
}

const getCheethHoarder = (address) => {
    // TODO: fetch token balance for cheeth token
    console.log('get cheeth amount for address', address);
    return 0;
}

module.exports = {
    verifySignature,
    getAdultMice,
    getBabyMice,
    getCheethGrindingMice,
    getBreedingMice,
    getCheethHoarder
}

const getInfuraUrl = (chainId) => {
    switch (Number.parseInt(chainId)) {
        case 1:
            return 'https://mainnet.infura.io/v3';
        case 3:
            return 'https://ropsten.infura.io/v3';
        case 4:
            return 'https://rinkeby.infura.io/v3';
        case 5:
            return 'https://goerli.infura.io/v3';
        case 137:
            return 'https://polygon-mainnet.infura.io/v3';
    }
};
