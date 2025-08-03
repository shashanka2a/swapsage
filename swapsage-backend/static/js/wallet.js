// Minimal WalletConnect v2 (CDN) setup using UMD build
let wcProvider = null;
let wcAddress = null;
let wcChainId = null;

const addressEl = document.getElementById("wc-address");
const btnConnect = document.getElementById("wc-connect");
const btnDisconnect = document.getElementById("wc-disconnect");

function short(addr) {
  return addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "";
}

function updateUI() {
  if (wcAddress) {
    addressEl.textContent = `${short(wcAddress)} • Chain ${wcChainId ?? "?"}`;
    addressEl.classList.remove("hidden");
    btnConnect.classList.add("hidden");
    btnDisconnect.classList.remove("hidden");
  } else {
    addressEl.textContent = "";
    addressEl.classList.add("hidden");
    btnConnect.classList.remove("hidden");
    btnDisconnect.classList.add("hidden");
  }
}

async function initProvider() {
  if (wcProvider) return wcProvider;

  const projectId = window.WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    console.warn("WALLETCONNECT_PROJECT_ID missing. Set it in .env and pass via view context.");
    return null;
  }

  wcProvider = await window.WalletConnectEthereumProvider.init({
    projectId,
    chains: [1],            // Ethereum mainnet
    optionalChains: [1],
    showQrModal: true,
    qrModalOptions: { themeMode: "light" }
  });

  wcProvider.on("accountsChanged", (accounts) => {
    wcAddress = (accounts && accounts[0]) || null;
    updateUI();
  });

  wcProvider.on("chainChanged", (hexChainId) => {
    wcChainId = parseInt(hexChainId, 16);
    updateUI();
  });

  wcProvider.on("disconnect", () => {
    wcAddress = null;
    wcChainId = null;
    updateUI();
  });

  return wcProvider;
}

async function connectWallet() {
  try {
    const provider = await initProvider();
    if (!provider) return;

    await provider.connect(); // opens QR modal
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    wcAddress = accounts && accounts[0] ? accounts[0] : null;

    const chainIdHex = await provider.request({ method: "eth_chainId" });
    wcChainId = parseInt(chainIdHex, 16);

    updateUI();
  } catch (err) {
    console.error("Wallet connect error:", err);
  }
}

async function disconnectWallet() {
  try {
    if (wcProvider) await wcProvider.disconnect();
    wcAddress = null;
    wcChainId = null;
    updateUI();
  } catch (err) {
    console.error("Wallet disconnect error:", err);
  }
}

if (btnConnect) btnConnect.addEventListener("click", connectWallet);
if (btnDisconnect) btnDisconnect.addEventListener("click", disconnectWallet);

// Expose for other scripts (e.g., app.js)
window.getConnectedWallet = () => ({ address: wcAddress, chainId: wcChainId });
