import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBgmAi64dIMP_-TM7fRB1sUzQCO4pe6_Nc",
  authDomain: "octonet-mobility.firebaseapp.com",
  projectId: "octonet-mobility",
  storageBucket: "octonet-mobility.firebasestorage.app",
  messagingSenderId: "556832715990",
  appId: "1:556832715990:web:16a0b99b1a9e0c9d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});
const appleProvider = new OAuthProvider("apple.com");

let mode = "signin";

function cleanName(raw) {
  if (!raw) return "Traveler";

  let name = raw.includes("@") ? raw.split("@")[0] : raw;
  name = name.replace(/[._-]+/g, " ");
  name = name.replace(/\d+/g, "");
  name = name.trim();

  if (!name) return "Traveler";

  const first = name.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function getFirstName(user) {
  if (!user) return "Traveler";

  if (user.displayName && user.displayName.trim()) {
    return cleanName(user.displayName);
  }

  if (user.email) {
    return cleanName(user.email);
  }

  return "Traveler";
}

function modal() {
  return document.getElementById("signinModal");
}

function setMessage(text, type = "info") {
  const box = document.getElementById("signinMessage");
  if (!box) return;
  box.textContent = text || "";
  box.className = "signin-message " + type;
}

function clearMessage() {
  setMessage("");
}

function setMode(nextMode) {
  mode = nextMode;
  clearMessage();

  const title = document.getElementById("signinTitle");
  const desc = document.getElementById("signinDesc");
  const main = document.getElementById("signinSubmitBtn");
  const create = document.getElementById("createAccountBtn");

  if (mode === "create") {
    if (title) title.textContent = "Create Account";
    if (desc) desc.textContent = "Create your OctoNet account to manage future eSIMs, billing, settings, and OctoCare tools.";
    if (main) main.textContent = "Create Account";
    if (create) create.textContent = "Already have an account?";
  } else {
    if (title) title.textContent = "Welcome Back";
    if (desc) desc.textContent = "Sign in to manage your eSIMs, billing, account settings, and OctoCare tools.";
    if (main) main.textContent = "Sign In";
    if (create) create.textContent = "Create Account";
  }
}

function openSignin(event) {
  if (event) event.preventDefault();
  setMode("signin");
  const m = modal();
  if (!m) return;
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  document.body.classList.add("signin-modal-open");
}

function closeSignin() {
  const m = modal();
  if (!m) return;
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
  document.body.classList.remove("signin-modal-open");
  clearMessage();
}

function closeAccountMenu() {
  document.querySelectorAll(".octo-account-menu").forEach((menu) => {
    menu.classList.remove("open");
  });
}

function openAccountMenu(button) {
  closeAccountMenu();

  let menu = button.parentElement.querySelector(".octo-account-menu");
  if (!menu) {
    menu = document.createElement("div");
    menu.className = "octo-account-menu";
    menu.innerHTML = `
      <a href="account.html">Dashboard</a>
      <a href="account.html#esims">My eSIMs</a>
      <a href="netpay.html">Billing</a>
      <a href="settings.html">Settings</a>
      <button type="button" data-signout="true">Sign Out</button>
    `;
    button.parentElement.appendChild(menu);
  }

  menu.classList.toggle("open");
}

function updateNav(user) {
  document.querySelectorAll("[data-open-signin]").forEach((button) => {
    button.classList.remove("signed-in");
    button.removeAttribute("data-signed-in");

    if (user) {
      button.textContent = "Hi " + getFirstName(user);
      button.classList.add("signed-in");
      button.setAttribute("data-signed-in", "true");
      button.setAttribute("title", "Account menu");
    } else {
      button.textContent = "Sign In";
      button.removeAttribute("title");
      closeAccountMenu();
    }
  });
}

function friendlyError(error) {
  const code = error && error.code ? error.code : "";
  if (code.includes("auth/invalid-email")) return "Enter a valid email address.";
  if (code.includes("auth/missing-password")) return "Enter your password.";
  if (code.includes("auth/weak-password")) return "Password should be at least 6 characters.";
  if (code.includes("auth/email-already-in-use")) return "That email already has an account. Try signing in.";
  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password") || code.includes("auth/user-not-found")) return "Email or password is incorrect.";
  if (code.includes("auth/popup-closed-by-user")) return "Sign-in popup was closed.";
  if (code.includes("auth/operation-not-allowed")) return "Google sign-in is not enabled in Firebase yet.";
  if (code.includes("auth/unauthorized-domain")) return "Add your exact Cloudflare Pages domain to Firebase Authorized Domains.";
  if (code.includes("auth/popup-blocked") || code.includes("auth/cancelled-popup-request")) return "Popup was blocked. Redirecting to Google sign-in...";
  if (code.includes("auth/internal-error")) return "Firebase internal error. Check that your exact Cloudflare URL is added in Firebase Authorized domains and Google sign-in is enabled.";
  return error?.message || "Something went wrong. Please try again.";
}

document.addEventListener("click", async (event) => {
  const signoutBtn = event.target.closest("[data-signout='true']");
  if (signoutBtn) {
    event.preventDefault();
    try {
      await signOut(auth);
      closeAccountMenu();
    } catch (error) {
      alert(friendlyError(error));
    }
    return;
  }

  const trigger = event.target.closest("[data-open-signin]");
  if (trigger) {
    event.preventDefault();

    if (auth.currentUser) {
      openAccountMenu(trigger);
    } else {
      openSignin(event);
    }
    return;
  }

  if (event.target.closest("[data-close-signin]")) {
    closeSignin();
    return;
  }

  if (event.target === modal()) {
    closeSignin();
    return;
  }

  if (!event.target.closest(".octo-account-menu")) {
    closeAccountMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSignin();
    closeAccountMenu();
  }
});

document.addEventListener("submit", async (event) => {
  if (!event.target.matches(".signin-form")) return;
  event.preventDefault();

  const email = document.getElementById("signinEmail")?.value.trim();
  const password = document.getElementById("signinPassword")?.value;

  if (!email || !password) {
    setMessage("Enter your email and password.", "error");
    return;
  }

  setMessage(mode === "create" ? "Creating account..." : "Signing in...", "info");

  try {
    if (mode === "create") {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    setMessage("Signed in successfully.", "success");
    setTimeout(closeSignin, 450);
  } catch (error) {
    setMessage(friendlyError(error), "error");
  }
});

document.addEventListener("click", async (event) => {
  if (event.target.closest("#googleSigninBtn")) {
    event.preventDefault();
    setMessage("Redirecting to Google sign in...", "info");
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Google sign-in error", error);
      setMessage(friendlyError(error), "error");
    }
    return;
  }

  if (event.target.closest("#appleSigninBtn")) {
    event.preventDefault();
    setMessage("Opening Apple sign in...", "info");
    try {
      await signInWithPopup(auth, appleProvider);
      setTimeout(closeSignin, 350);
    } catch (error) {
      setMessage(friendlyError(error), "error");
    }
  }

  if (event.target.closest("#createAccountBtn")) {
    event.preventDefault();
    setMode(mode === "create" ? "signin" : "create");
  }

  if (event.target.closest("#forgotPasswordBtn")) {
    event.preventDefault();
    const email = document.getElementById("signinEmail")?.value.trim();
    if (!email) {
      setMessage("Enter your email first, then press Forgot Password again.", "error");
      return;
    }

    setMessage("Sending password reset email...", "info");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent.", "success");
    } catch (error) {
      setMessage(friendlyError(error), "error");
    }
  }
});

function updateAccountPage(user) {
  const signinPrompt = document.getElementById("signinPrompt");
  const loadingPanel = document.getElementById("loadingPanel");
  const dashboard = document.getElementById("accountDashboard");
  const greeting = document.getElementById("accountGreeting");
  const subGreeting = document.getElementById("accountSubGreeting");
  const emailLine = document.getElementById("accountEmailLine");

  if (!signinPrompt || !dashboard) return;

  if (loadingPanel) loadingPanel.classList.add("hidden");

  if (user) {
    localStorage.setItem("octonet_signed_in", "true");
    if (user.email) localStorage.setItem("octonet_email", user.email);
    localStorage.setItem("octonet_name", getFirstName(user));

    signinPrompt.classList.add("hidden");
    dashboard.classList.remove("hidden");
    if (greeting) greeting.textContent = "Welcome back, " + getFirstName(user);
    if (subGreeting) subGreeting.textContent = "You are signed in to OctoNet Mobility.";
    if (emailLine) emailLine.textContent = user.email || "Google Account";
  } else {
    localStorage.removeItem("octonet_signed_in");
    localStorage.removeItem("octonet_email");
    localStorage.removeItem("octonet_name");

    signinPrompt.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
}

getRedirectResult(auth)
  .then((result) => {
    if (result?.user) {
      setMessage("Signed in with Google.", "success");
      setTimeout(closeSignin, 350);
    }
  })
  .catch((error) => {
    setMessage(friendlyError(error), "error");
  });

onAuthStateChanged(auth, (user) => {
  updateNav(user);
  updateAccountPage(user);
});

window.openOctoNetSignIn = openSignin;
