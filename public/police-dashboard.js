// =============================
// POLICE DASHBOARD - IPFS + BLOCKCHAIN VERSION
// =============================

let web3;
let contract;
let userAccount;
let userData;

const contractAddress = "0x80aF0De1899e85E8658616A98a78eB5A4D1B72c3"; 
// ⚠️ Update if redeployed

// 🔐 PASTE YOUR NEW PINATA JWT HERE
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIyYjYxZjk4ZC02ZTI5LTQ2ZWYtOGI3MS1kNDgxNTAwNGUzNTUiLCJlbWFpbCI6Im05NDkzODgzNDc2QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI4ZTBkMTY1NzU5Yjg5YjQxZmY0OSIsInNjb3BlZEtleVNlY3JldCI6Ijk4NzFhN2RjNjQ1YmVmNGI3NDM1ODEwY2IzN2JiMTkzZmRjYjYyZjYyODNiM2M3YWUzNTI5YmQ1OGExOGFhZWYiLCJleHAiOjE4MDM4MzM2NTF9.L_wQ8rlBHs1lDli9Ow55iQyKVb2sYA-mf3Sun4Om1y0";

// =============================
// DOM
// =============================
const evidenceForm = document.getElementById("evidence-form");
const uploadStatus = document.getElementById("upload-status");
const evidenceList = document.getElementById("evidence-list");

// =============================
// INIT
// =============================
window.addEventListener("load", async () => {
  checkLoginStatus();
  await initializeWeb3();
  evidenceForm.addEventListener("submit", uploadEvidence);
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

  if (userData.role !== "Police") {
    alert("Access denied. Police only.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-name").textContent = userData.name;
  document.getElementById("user-role").textContent = userData.role;
}

// =============================
// INIT WEB3 + LOAD ABI
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

  console.log("✅ Police Dashboard connected");

  loadEvidenceList();
}

// =============================
// UPLOAD EVIDENCE
// =============================
async function uploadEvidence(e) {
  e.preventDefault();

  const evidenceId = document.getElementById("evidence-id").value.trim();
  const caseNumber = document.getElementById("case-number").value.trim();
  const location = document.getElementById("location").value.trim();
  const crimeDescription = document.getElementById("crime-description").value.trim();
  const evidenceType = document.getElementById("evidence-type").value;
  const file = document.getElementById("evidence-file").files[0];
  const password = document.getElementById("evidence-password").value.trim();

  if (!evidenceId || !caseNumber || !location || !crimeDescription || !evidenceType || !file || !password) {
    showMessage("All fields are required", "error");
    return;
  }

  try {

    showMessage("Uploading to IPFS...", "warning");

    // =============================
    // 1️⃣ Upload File to Pinata
    // =============================
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`
        },
        body: formData
      }
    );

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.IpfsHash) {
      throw new Error("IPFS upload failed");
    }

    const ipfsHash = uploadResult.IpfsHash;

    console.log("✅ Uploaded to IPFS:", ipfsHash);

    // =============================
    // 2️⃣ Save to Blockchain
    // =============================
    showMessage("Saving to Blockchain...", "warning");

    await contract.methods.addEvidence(
      evidenceId,
      ipfsHash,
      caseNumber,
      location,
      crimeDescription,
      evidenceType,
      password
    ).send({ from: userAccount });

    showMessage("Evidence Uploaded Successfully ✅", "success");

    evidenceForm.reset();
    loadEvidenceList();

  } catch (error) {
    console.error("Upload error:", error);
    showMessage(error?.message || "Upload failed", "error");
  }
}

// =============================
// LOAD EVIDENCE LIST
// =============================
async function loadEvidenceList() {
  try {

    const count = await contract.methods.getEvidenceCount().call();
    evidenceList.innerHTML = "";

    if (count == 0) {
      evidenceList.innerHTML = "<p>No evidence uploaded yet</p>";
      return;
    }

    for (let i = 0; i < count; i++) {
      const evidenceId = await contract.methods.getEvidenceId(i).call();
      const div = document.createElement("div");
      div.className = "evidence-item";
      div.innerHTML = `<h3>Evidence ID: ${evidenceId}</h3>`;
      evidenceList.appendChild(div);
    }

  } catch (error) {
    console.error("Load error:", error);
  }
}

// =============================
// MESSAGE FUNCTION
// =============================
function showMessage(message, type) {
  uploadStatus.textContent = message;
  uploadStatus.className = "message " + type;
}