/* --------------------------------------------------------- */
/* document ready */
$(() => {
  if (!hasWeb3()) {
    $("#error-popup").show();
  } else {
    init();
  }
});
/* --------------------------------------------------------- */

/* --------------------------------------------------------- */
/* constants */
const apiUrlNonce = "/api/nonce";
const apiUrlSignIn = "/api/sign_in";
/* --------------------------------------------------------- */

/* --------------------------------------------------------- */
/* utility methods */
const hasWeb3 = function () {
  return window.ethereum !== undefined;
};

async function getDisplayableAddress(address) {
  let ensAddress = await provider.lookupAddress(address);
  if (ensAddress) {
    return ensAddress;
  } else {
    return address.substring(0, 8);
  }
}
/* --------------------------------------------------------- */

/* --------------------------------------------------------- */
/* app */
const init = async () => {
  window.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  window.signer = provider.getSigner();
  await provider.send("eth_requestAccounts", []);
  window.nonce = await fetch(apiUrlNonce).then((res) => res.text());
  window.account = await signer.getAddress();
  window.ens = await getDisplayableAddress(account);
  $("#walletAddressValue").text(ens || account);
  $('#signin').click(async () => {
    await signMessage();
  })
};
/* --------------------------------------------------------- */


/* signature process */

const generateMessage = async () => {

    let message = {
        domain: document.location.host,
        address: window.account,
        chainId: `${await provider.getNetwork().then(({ chainId }) => chainId)}`,
        uri: document.location.origin,
        version: '1',
        statement: 'Anonymice Discord Bot',
        type: 'Personal signature',
        nonce: window.nonce
    }

    return message;
}

const signMessage = async () => {
    
    let message = await generateMessage();
    let jsonMessage = JSON.stringify(message);
    let signature = await provider.getSigner().signMessage(jsonMessage);
    
    message.signature = signature;
    
    
    fetch(apiUrlSignIn, {
        method: 'POST',
        body: JSON.stringify(message),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    }).then(async (res) => {
        if(res.status === 200) {
            res.json().then(({}) => {

            })
        }
        else {
            res.json().then((err) => {
                console.error(err);
            })
        }
    })
}