import { createClient } from "@neondatabase/neon-js";

const $ = (id) => document.getElementById(id);
const panel = $("authPanel");
const form = $("authForm");
let client = null;
let signedInUser = null;

function message(text, isError = false) {
  const target = $("authMessage");
  target.textContent = text;
  target.style.color = isError ? "#b42318" : "";
}

function errorText(error) {
  return error?.message || error?.error?.message || "The account request could not be completed.";
}

async function loadHistory() {
  const list = $("historyList");
  list.replaceChildren();
  if (!signedInUser || !client) return;

  const { data, error } = await client
    .from("test_attempts")
    .select("id, test_title, score_earned, score_possible, percent, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    message(`Signed in, but history could not be loaded: ${error.message}`, true);
    return;
  }
  if (!data?.length) {
    const item = document.createElement("li");
    item.textContent = "No submitted tests yet. Your saved results will appear here.";
    list.append(item);
    return;
  }
  for (const attempt of data) {
    const item = document.createElement("li");
    const date = new Date(attempt.created_at).toLocaleDateString();
    item.textContent = `${date} · ${attempt.test_title} · ${attempt.score_earned}/${attempt.score_possible} (${attempt.percent}%)`;
    list.append(item);
  }
}

async function refreshAccount() {
  if (!client) return;
  try {
    const result = await client.auth.getSession();
    signedInUser = result?.data?.user || result?.user || null;
  } catch {
    signedInUser = null;
  }
  $("accountLabel").textContent = signedInUser
    ? `Signed in as ${signedInUser.name || signedInUser.email}`
    : "Sign in to save test history";
  $("signInButton").classList.toggle("hidden", Boolean(signedInUser));
  $("signUpButton").classList.toggle("hidden", Boolean(signedInUser));
  $("signOutButton").classList.toggle("hidden", !signedInUser);
  $("authName").classList.toggle("hidden", Boolean(signedInUser));
  $("authEmail").classList.toggle("hidden", Boolean(signedInUser));
  $("authPassword").classList.toggle("hidden", Boolean(signedInUser));
  form.onsubmit = signedInUser ? (event) => event.preventDefault() : signIn;
  message(signedInUser ? "Your test history is private to your account." : "Sign in or create an account to save your history.");
  await loadHistory();
}

async function signIn(event) {
  event.preventDefault();
  try {
    const result = await client.auth.signIn.email({
      email: $("authEmail").value.trim(),
      password: $("authPassword").value
    });
    if (result?.error) throw result.error;
    $("authPassword").value = "";
    await refreshAccount();
  } catch (error) {
    message(errorText(error), true);
  }
}

async function signUp() {
  try {
    const result = await client.auth.signUp.email({
      email: $("authEmail").value.trim(),
      password: $("authPassword").value,
      name: $("authName").value.trim() || $("authEmail").value.trim()
    });
    if (result?.error) throw result.error;
    $("authPassword").value = "";
    await refreshAccount();
  } catch (error) {
    message(errorText(error), true);
  }
}

async function signOut() {
  try {
    await client.auth.signOut();
    signedInUser = null;
    await refreshAccount();
  } catch (error) {
    message(errorText(error), true);
  }
}

async function saveAttempt(submission) {
  if (!client || !signedInUser || !submission?.score) return;
  const earned = submission.score.earned ?? submission.score.autoEarned ?? 0;
  const possible = submission.score.possible ?? submission.score.autoPossible ?? 0;
  try {
    const { error } = await client.from("test_attempts").insert({
      user_id: signedInUser.id,
      test_id: submission.test?.id || "unknown",
      test_title: submission.test?.title || "Untitled test",
      score_earned: Number(earned),
      score_possible: Number(possible),
      percent: Number(possible) ? Math.round(Number(earned) / Number(possible) * 100) : 0,
      result: submission
    });
    if (error) throw error;
    message("Result saved to your private test history.");
    await loadHistory();
  } catch (error) {
    message(`Your score is ready, but it was not saved: ${errorText(error)}`, true);
  }
}

window.TestDeskAuth = { saveAttempt };

$("accountToggle").addEventListener("click", () => {
  panel.classList.toggle("hidden");
});
$("signUpButton").addEventListener("click", signUp);
$("signOutButton").addEventListener("click", signOut);

try {
  const response = await fetch("./site-config.json", { cache: "no-store" });
  const config = await response.json();
  if (!config.neonAuthUrl || !config.neonDataApiUrl) {
    message("Neon login is not configured yet. Add the Auth and Data API URLs to site-config.json.");
  } else {
    client = createClient({
      auth: { url: config.neonAuthUrl },
      dataApi: { url: config.neonDataApiUrl }
    });
    await refreshAccount();
  }
} catch {
  message("Could not load account configuration. You can still take and score a test locally.", true);
}
