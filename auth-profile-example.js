// Example Firebase auth profile swap
// Replace navbar text after user signs in

function updateProfileName(user) {
  const profileName = document.getElementById("profileName");

  if (!profileName) return;

  if (user && user.displayName) {
    profileName.textContent = `Hi ${user.displayName}`;
  } else {
    profileName.textContent = "Sign In";
  }
}
