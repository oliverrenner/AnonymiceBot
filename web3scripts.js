const {providers, Contract, utils} = require('ethers');
const {
    VERIFICATION_PORT,
    INFURA_KEY,
    VERIFICATION_HOST,
} = require("./variables");

const miceContractAddress = '0xC7492fDE60f2eA4DBa3d7660e9B6F651b2841f00';
const cheethContractAddress = '0x5f7BA84c7984Aa5ef329B66E313498F0aEd6d23A';
const babyMiceContractAddress = '0x15cc16bfe6fac624247490aa29b6d632be549f00';
const cheethAbi = require('./cheeth_abi.json');
const miceAbi = require('./mice_abi.json');
const babyMiceAbi = require('./baby_mice_abi.json');

const initProvider = async (message) => {
    let url = `${getInfuraUrl(
        message.chainId
    )}/` + process.env.INFURA_KEY;
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
    return infuraProvider;
}

const verifySignature = async (message) => {
    const infuraProvider = await initProvider(message);

    const result = await validate(message, infuraProvider);
    const verifiedMessage = await result;

    if (message.nonce !== verifiedMessage.nonce) {
        console.log('verification failed', verifiedMessage);
        return false;
    }

    console.log('successfully verified', verifiedMessage);
    return true;
}

const getAdultMice = async (message) => {
    console.log('get adult mice for address', message.address);
    try {
        const provider = await initProvider(message);
        const walletContract = new Contract(miceContractAddress, miceAbi, provider);
        const result = await walletContract.balanceOf(message.address);
        return result.toNumber() > 0 ? [1] : []; // quickfix as we dont get tokenIds
    } catch (e) {
        console.log('error getAdultMice', e);
        return 0;
    }
}

const getBabyMice = async (message) => {
    console.log('get baby mice for address', message.address);
    try {
        const provider = await initProvider(message);
        const walletContract = new Contract(babyMiceContractAddress, babyMiceAbi, provider);
        const result = await walletContract.balanceOf(message.address);
        return result.toNumber() > 0 ? [1] : []; // quickfix as we dont get tokenIds
    } catch (e) {
        console.log('error getBabyMice', e);
        return 0;
    }
}

const getCheethGrindingMice = async (message) => {
    console.log('get adult mice for address', message.address);
    try {
        const provider = await initProvider(message);
        const walletContract = new Contract(cheethContractAddress, cheethAbi, provider);
        const result = await walletContract.getTokensStaked(message.address);
        return result.map(r => r.toNumber());
    } catch (e) {
        console.log('error getAdultMice', e);
        return 0;
    }
}

const getBreedingMice = async (message) => {
    // TODO: fetch all staked mice from breeding contract
    console.log('get breeding mice for address', message.address);
    return ['todo'];
}

const getCheethHoarder = async (message) => {
    console.log('get cheeth for address', message.address);
    try {
        const provider = await initProvider(message);
        const walletContract = new Contract(babyMiceContractAddress, babyMiceAbi, provider);
        const result = await walletContract.balanceOf(message.address);
        return result.toNumber();
    } catch (e) {
        console.log('error getCheethHoarder', e);
        return 0;
    }
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
