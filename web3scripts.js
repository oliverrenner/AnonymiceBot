const {providers, Contract, utils} = require('ethers');
const {
    VERIFICATION_PORT,
    INFURA_KEY,
    VERIFICATION_HOST,
} = require("./variables");

const contractAddress = '0xC7492fDE60f2eA4DBa3d7660e9B6F651b2841f00';
const abi = require('./contract_abi.json');

const verifySignature = async (message) => {
    let url = `${getInfuraUrl(
        message.chainId
    )}/`+process.env.INFURA_KEY;
    console.log('url', url);
    const infuraProvider = new providers.JsonRpcProvider(
        {
            allowGzip: true,
            url: url,
            headers: {
                Accept: "*/*",
                Origin: `${VERIFICATION_HOST}:${VERIFICATION_PORT}`,
                "Accept-Encoding": "gzip, deflate, br",
                "Content-Type": "application/json",
            },
        },
        Number.parseInt(message.chainId)
    );

    await infuraProvider.ready;

    const result = await validate(message, infuraProvider);
    const verifiedMessage = await result;

    if (message.nonce !== verifiedMessage.nonce) {
        console.log('verification failed', verifiedMessage);
        return false;
    }

    console.log('successfully verified', verifiedMessage);
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

const validate = async (message, provider) => {
    return new Promise(async (resolve, reject) => {
        try {
            let {signature, address} = message;
            let missing = [];
            if (!message) {
                missing.push('`message`');
            }

            if (!signature) {
                missing.push('`signature`');
            }
            if (!address) {
                missing.push('`address`');
            }
            if (missing.length > 0) {
                throw new Error(
                    `MALFORMED_SESSION missing: ${missing.join(', ')}.`
                );
            }

            const originalMessage = JSON.parse(JSON.stringify(message));
            delete originalMessage.signature; // remove signature as it was not present in originally signed message
            const addr = utils.verifyMessage(
                JSON.stringify(originalMessage),
                signature
            );

            if (addr.toLowerCase() !== address.toLowerCase()) {
                try {
                    //EIP-1271
                    const isValidSignature =
                        await checkContractWalletSignature(message, provider);
                    if (!isValidSignature) {
                        throw new Error(
                            `INVALID_SIGNATURE: ${addr} !== ${address}`
                        );
                    }
                } catch (e) {
                    throw e;
                }
            }

            if (
                message.expirationTime &&
                new Date().getTime() >=
                new Date(message.expirationTime).getTime()
            ) {
                throw new Error("expired");
            }
            resolve(message);
        } catch (e) {
            reject(e);
        }
    });
}

const checkContractWalletSignature = async (message, provider) => {
    if (!provider) {
        return false;
    }

    const abi = [
        'function isValidSignature(bytes32 _message, bytes _signature) public view returns (bool)',
    ];
    try {
        const walletContract = new Contract(message.address, abi, provider);
        const hashMessage = utils.hashMessage(JSON.stringify(message));
        return await walletContract.isValidSignature(
            hashMessage,
            message.signature
        );
    } catch (e) {
        throw e;
    }
};
