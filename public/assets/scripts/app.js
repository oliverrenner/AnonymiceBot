/* --------------------------------------------------------- */
/* document ready */
$(() => {
  if (typeof errorModel !== "undefined" && errorModel.message) {
    showError(errorModel.message);
    return;
  }

  if (!hasWeb3()) {
    $("#web3-error-popup").removeClass("hidden");
    $("#web3-error-popup")[0].scrollIntoView();
  } else {
    init();
  }
});
/* --------------------------------------------------------- */

/* --------------------------------------------------------- */
/* apis */
const apiUrlSignIn = "/api/signin";
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
  window.provider.on("network", (newNetwork, oldNetwork) => {
    if(oldNetwork) {
      window.location.reload();
    }
  });
  ethereum.on('accountsChanged', function (accounts) {
    if(accounts && accounts.length > 0) {
      if(window.account != accounts[0]) {
        window.location.reload();
      }
    }
    
  });

  window.signer = provider.getSigner();
  await provider.send("eth_requestAccounts", []);
  let address = await signer.getAddress();
  window.account = ethers.utils.getAddress(address);
  $("#walletAddressValue").text(account);

  displayAddress(account, (ens) => {
    $("#walletAddressValue").text(ens || account);
  });

  $("#signin").click(async () => {
    $("#signin").prop("disabled", true);
    await signMessage().catch(() => $("#signin").prop("disabled", false));
  });
};
/* --------------------------------------------------------- */

/* signature process */

const generateMessage = async () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  let message = {
    domain: document.location.host,
    address: window.account.toLowerCase(),
    chainId: `${await provider.getNetwork().then(({ chainId }) => chainId)}`,
    uri: document.location.origin,
    version: "1",
    statement: "Anonymice Discord Bot",
    type: "Personal signature",
    nonce: urlParams.get("requestId"),
  };

  return message;
};

const amountOfMemes = 5;
let memeIdx = 0;
const nextMeme = () => {
  memeIdx += 1;
  if (memeIdx > amountOfMemes) {
    memeIdx = 1;
  }
  $(".meme-img").attr("src", "assets/images/meme_" + memeIdx + ".png");
};

const signMessage = async () => {
  let message = await generateMessage();
  let jsonMessage = JSON.stringify(message);
  let data = ethers.utils.toUtf8Bytes(jsonMessage);
  let signature = await provider.send('personal_sign', [ethers.utils.hexlify(data), window.account.toLowerCase()])
  //let signature = await provider.getSigner().signMessage(jsonMessage);
  

  $(".memes").removeClass("hidden");
  message.signature = signature;

  let genericErrorMessage = "An error occurred. Please try again.";
  $.ajax({
    type: "POST",
    url: apiUrlSignIn,
    dataTye: "json",
    data: message,
    statusCode: {
      422: function (res) {
        showError(res.text);
      },
    },
  })
    .done((data) => {
      $("#signin").prop("disabled", false);

      if (!data || !data.status || !Array.isArray(data.status)) {
        showError(genericErrorMessage);
        return;
      }

      var roles = data.status
        .filter((s) => s.qualified === true)
        .map((s) => s.role)
        .join(", ");
      if (roles) {
        $(".success-bad").addClass("hidden");
        $(".roles").text(roles);
      } else {
        $(".success-good").addClass("hidden");
        $(".roles").text("None. Please verify again with a different wallet.");
      }
      $(".verify").addClass("hidden");
      $(".meme-message").addClass("hidden");
      $(".success").removeClass("hidden");
    })
    .fail((xhr, textStatus, errorThrown) => {
      showError(genericErrorMessage);
    });
};

const showError = async (message) => {
  $("#errorText").text(message);
  $("#error-popup-button").show();
  $("#error-popup").show();
  $("#error-popup")[0].scrollIntoView();
};
