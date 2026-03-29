// =============================
// COURT DASHBOARD - FINAL IPFS VERSION
// =============================

let web3;
let contract;
let userAccount;
let userData;

const contractAddress = "0x80aF0De1899e85E8658616A98a78eB5A4D1B72c3"; 
// ⚠️ Update if redeployed

// =============================
// DOM ELEMENTS
// =============================
const verifyBtn = document.getElementById("verify-btn");
const verifyEvidenceId = document.getElementById("verify-evidence-id");
const verifyPassword = document.getElementById("verify-password");
const verificationMessage = document.getElementById("verification-message");
const verificationResult = document.getElementById("verification-result");
const downloadEvidenceBtn = document.getElementById("download-evidence");
const evidenceList = document.getElementById("evidence-list");
const logoutBtn = document.getElementById("logout-btn");

// =============================
// PAGE LOAD
// =============================
window.addEventListener("load", async () => {
  checkLoginStatus();
  await initializeWeb3();

  verifyBtn.addEventListener("click", verifyEvidence);
  downloadEvidenceBtn.addEventListener("click", downloadCurrentEvidence);
  logoutBtn.addEventListener("click", logout);
});

// =============================
// CHECK LOGIN
// =============================
function checkLoginStatus() {
  const loggedInUser = localStorage.getItem("blockchainEvidenceUser");

  if (!loggedInUser) {
    window.location.href = "index.html";
    return;
  }

  userData = JSON.parse(loggedInUser);

  if (userData.role !== "Court") {
    alert("Access denied. Court only.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-name").textContent = userData.name;
  document.getElementById("user-role").textContent = userData.role;
}

// =============================
// INITIALIZE WEB3 + LOAD ABI
// =============================
async function initializeWeb3() {

  if (!window.ethereum) {
    alert("Install MetaMask");
    return;
  }

  web3 = new Web3(window.ethereum);

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts"
  });

  userAccount = accounts[0];

  const response = await fetch("../build/contracts/EvidenceManagement.json");
  const contractData = await response.json();

  contract = new web3.eth.Contract(
    contractData.abi,
    contractAddress
  );

  console.log("✅ Court Dashboard connected");

  loadEvidenceList();
}

// =============================
// LOAD EVIDENCE IDS
// =============================
async function loadEvidenceList() {
  try {

    const count = await contract.methods.getEvidenceCount().call();
    evidenceList.innerHTML = "";

    if (count == 0) {
      evidenceList.innerHTML = "<p>No evidence found</p>";
      return;
    }

    for (let i = 0; i < count; i++) {
      const id = await contract.methods.getEvidenceId(i).call();
      createEvidenceCard(id);
    }

  } catch (error) {
    console.error("Load error:", error);
  }
}

function createEvidenceCard(id) {
  const card = document.createElement("div");
  card.className = "evidence-item";
  card.innerHTML = `
    <h3>Evidence ID: ${id}</h3>
    <button onclick="fillVerify('${id}')">Verify</button>
  `;
  evidenceList.appendChild(card);
}

function fillVerify(id) {
  verifyEvidenceId.value = id;
  window.scrollTo(0, 0);
}

// =============================
// VERIFY EVIDENCE
// =============================
async function verifyEvidence() {

  const evidenceId = verifyEvidenceId.value.trim();
  const password = verifyPassword.value.trim();

  if (!evidenceId || !password) {
    showMessage("Enter Evidence ID and Password", "warning");
    return;
  }

  try {

    showMessage("Verifying...", "warning");
    verificationResult.classList.add("hidden");

    const evidence = await contract.methods
      .getEvidence(evidenceId, password)
      .call({ from: userAccount });

    const date = new Date(Number(evidence.timestamp) * 1000);

    document.getElementById("result-id").textContent = evidenceId;
    document.getElementById("result-case").textContent = evidence.caseNumber;
    document.getElementById("result-location").textContent = evidence.location;
    document.getElementById("result-description").textContent = evidence.crimeDescription;
    document.getElementById("result-type").textContent = evidence.evidenceType;
    document.getElementById("result-officer").textContent = evidence.officerName;
    document.getElementById("result-timestamp").textContent = date.toLocaleString();
    document.getElementById("result-status").textContent = "Verified on Blockchain ✅";

    // Store CID safely
    downloadEvidenceBtn.dataset.ipfsHash = evidence.ipfsHash;

    verificationResult.classList.remove("hidden");
    showMessage("Evidence Verified Successfully", "success");

  } catch (error) {
    console.error("Verification error:", error);
    showMessage("Incorrect password or evidence not found", "error");
  }
}

// =============================
// DOWNLOAD FILE (FIXED GATEWAY)
// =============================
function downloadCurrentEvidence() {

  const ipfsHash = downloadEvidenceBtn.dataset.ipfsHash;

  if (!ipfsHash || ipfsHash.length < 10) {
    showMessage("Invalid IPFS hash", "error");
    return;
  }

  // ✅ Use Pinata gateway (more reliable than ipfs.io)
  const fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

  window.open(fileUrl, "_blank");
}

// =============================
// LOGOUT
// =============================
function logout() {
  localStorage.removeItem("blockchainEvidenceUser");
  window.location.href = "index.html";
}

// =============================
// MESSAGE HELPER
// =============================
function showMessage(message, type) {
  verificationMessage.textContent = message;
  verificationMessage.className = "message " + type;
}