/* --------------------------------------------------------- */
/* document ready */
$(() => {
  if (!hasWeb3()) {
    $("#web3-error-popup").show();
  } else {
    init();
  }
});
/* --------------------------------------------------------- */

/* --------------------------------------------------------- */
/* apis */
const apiUrlSignIn = "/api/sign_in";
/* --------------------------------------------------------- */

/* --------------------------------------------------------- */
/* utility methods */
const hasWeb3 = function () {
  return window.ethereum !== undefined;
};

function displayAddress(address, cb) {
  provider.lookupAddress(address).then((res) => {
    let result = res || address.substring(0, 8);
    cb(result);
  });
}
/* --------------------------------------------------------- */

/* --------------------------------------------------------- */
/* app */
const init = async () => {
  window.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  window.signer = provider.getSigner();
  await provider.send("eth_requestAccounts", []);
  let address = await signer.getAddress();
  window.account = ethers.utils.getAddress(address);
  $("#walletAddressValue").text(account);

  displayAddress(account, (ens) => {
    $("#walletAddressValue").text(ens || account);
  });

  $("#signin").click(async () => {
    await signMessage();
  });
};
/* --------------------------------------------------------- */

/* signature process */

const generateMessage = async () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  let message = {
    domain: document.location.host,
    address: window.account,
    chainId: `${await provider.getNetwork().then(({ chainId }) => chainId)}`,
    uri: document.location.origin,
    version: "1",
    statement: "Anonymice Discord Bot",
    type: "Personal signature",
    nonce: urlParams.get("requestId"),
  };

  return message;
};

const signMessage = async () => {
  let message = await generateMessage();
  let jsonMessage = JSON.stringify(message);
  let signature = await provider.getSigner().signMessage(jsonMessage);

  message.signature = signature;

  fetch(apiUrlSignIn, {
    method: "POST",
    body: JSON.stringify(message),
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })
    .then(handleFetchErrors)
    .then(async (res) => {
      if (res.status === 200) {
        res.json().then(({}) => {});
      } else {
        res.json().then((err) => {
          console.error(err);
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
};

const handleFetchErrors = async (response) => {
  if (!response.ok) {
    var responseMessage = await response.json().then(data => {
      $("#errorText").text(data.message);
      $("#error-popup-button").show();
      $("#error-popup").show();
    })
    
  }
  return response;
};

const closeErrorPopup = () => {
  $("#errorText").text('');
  $("#error-popup-button").hide();
  $("#error-popup").hide();
};
