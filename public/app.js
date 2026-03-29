// ===============================
// TRUSTCHAIN EMS - AUTH SCRIPT
// ===============================

// Web3 Variables
let web3;
let contract;
let userAccount = null;

// 🔹 Your deployed contract address
const contractAddress = "0x80aF0De1899e85E8658616A98a78eB5A4D1B72c3";

// ===============================
// PAGE LOAD
// ===============================
window.addEventListener("DOMContentLoaded", async () => {

  if (typeof window.ethereum === "undefined") {
    alert("❌ Please install MetaMask");
    return;
  }

  try {
    web3 = new Web3(window.ethereum);

    // 🔥 Load ABI dynamically
    const response = await fetch("../build/contracts/EvidenceManagement.json");
    const contractData = await response.json();

    contract = new web3.eth.Contract(
      contractData.abi,
      contractAddress
    );

    console.log("✅ Web3 + Contract initialized with dynamic ABI");

  } catch (error) {
    console.error("Initialization error:", error);
  }

  // Button Listeners
  document.getElementById("connect-metamask")
    ?.addEventListener("click", connectMetaMask);

  document.getElementById("register-connect-metamask")
    ?.addEventListener("click", connectMetaMask);

  document.getElementById("login-btn")
    ?.addEventListener("click", login);

  document.getElementById("register-btn")
    ?.addEventListener("click", register);
});

// ===============================
// CONNECT METAMASK
// ===============================
async function connectMetaMask() {
  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    userAccount = accounts[0];

    if (document.getElementById("login-address"))
      document.getElementById("login-address").value = userAccount;

    if (document.getElementById("register-address"))
      document.getElementById("register-address").value = userAccount;

    if (document.getElementById("login-btn"))
      document.getElementById("login-btn").disabled = false;

    if (document.getElementById("register-btn"))
      document.getElementById("register-btn").disabled = false;

    alert("✅ MetaMask Connected");

  } catch (error) {
    console.error("MetaMask connection error:", error);
    alert("Connection failed");
  }
}

// ===============================
// LOGIN FUNCTION
// ===============================
async function login() {

  if (!userAccount) {
    alert("⚠️ Connect MetaMask first");
    return;
  }

  try {
    const isRegistered = await contract.methods
      .isUserRegistered(userAccount)
      .call();

    if (!isRegistered) {
      alert("❌ User not registered");
      return;
    }

    const role = await contract.methods
      .getUserRole(userAccount)
      .call();

    const name = await contract.methods
      .getUserName(userAccount)
      .call();

    localStorage.setItem("blockchainEvidenceUser", JSON.stringify({
      address: userAccount,
      name: name,
      role: role
    }));

    alert("✅ Login Successful");

    redirectToDashboard(role);

  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed");
  }
}

// ===============================
// REGISTER FUNCTION
// ===============================
async function register() {

  if (!userAccount) {
    alert("⚠️ Connect MetaMask first");
    return;
  }

  const fullname = document.getElementById("fullname")?.value.trim();
  const role = document.getElementById("role")?.value;

  if (!fullname || !role) {
    alert("⚠️ Fill all fields");
    return;
  }

  try {
    const isRegistered = await contract.methods
      .isUserRegistered(userAccount)
      .call();

    if (isRegistered) {
      alert("⚠️ User already registered");
      return;
    }

    await contract.methods
      .registerUser(fullname, role)
      .send({ from: userAccount });

    alert("✅ Registration Successful");

    localStorage.setItem("blockchainEvidenceUser", JSON.stringify({
      address: userAccount,
      name: fullname,
      role: role
    }));

    redirectToDashboard(role);

  } catch (error) {
    console.error("Registration error:", error);
    alert("Registration failed");
  }
}

// ===============================
// REDIRECT FUNCTION
// ===============================
function redirectToDashboard(role) {

  if (role === "Police") {
    window.location.href = "dashboard-police.html";
  } 
  else if (role === "Court") {
    window.location.href = "dashboard-court.html";
  } 
  else {
    alert("Unknown role");
  }
}