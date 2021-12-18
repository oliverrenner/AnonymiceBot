const getProvider = require("./provider");
const { utils, Contract } = require("ethers");

const verifySignature = async (message) => {
  const infuraProvider = await getProvider(message);

  const result = await validate(message, infuraProvider);
  const verifiedMessage = await result;

  if (message.nonce !== verifiedMessage.nonce) {
    return false;
  }
  return true;
};

const validate = async (message, provider) => {
  return new Promise(async (resolve, reject) => {
    try {
      let { signature, address } = message;
      let missing = [];
      if (!message) {
        missing.push("`message`");
      }

      if (!signature) {
        missing.push("`signature`");
      }
      if (!address) {
        missing.push("`address`");
      }
      if (missing.length > 0) {
        throw new Error(`MALFORMED_SESSION missing: ${missing.join(", ")}.`);
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
          const isValidSignature = await checkContractWalletSignature(
            message,
            provider
          );
          if (!isValidSignature) {
            throw new Error(`INVALID_SIGNATURE: ${addr} !== ${address}`);
          }
        } catch (e) {
          throw e;
        }
      }

      if (
        message.expirationTime &&
        new Date().getTime() >= new Date(message.expirationTime).getTime()
      ) {
        throw new Error("expired");
      }
      resolve(message);
    } catch (e) {
      reject(e);
    }
  });
};

const checkContractWalletSignature = async (message, provider) => {
  if (!provider) {
    return false;
  }

  const abi = [
    "function isValidSignature(bytes32 _message, bytes _signature) public view returns (bool)",
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

module.exports = verifySignature;
