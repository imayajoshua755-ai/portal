
const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const formTitle = document.getElementById("formTitle");
const message = document.getElementById("message");
const switchLink = document.getElementById("switchLink");
const switchText = document.getElementById("switchText");

let registering = false;

function showMessage(text) {
  message.textContent = text;
}

function showLoginForm() {
  registering = false;
  formTitle.textContent = "Student Login";
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  switchText.innerHTML =
    'Don\'t have an account? <a href="#" id="switchLink">Register here</a>';
  document.getElementById("switchLink").onclick = toggleForm;
  showMessage("");
}

function toggleForm(event) {
  event.preventDefault();
  registering = !registering;

  loginForm.classList.toggle("hidden", registering);
  registerForm.classList.toggle("hidden", !registering);

  formTitle.textContent = registering
    ? "Student Registration"
    : "Student Login";

  switchText.innerHTML = registering
    ? 'Already have an account? <a href="#" id="switchLink">Login here</a>'
    : 'Don\'t have an account? <a href="#" id="switchLink">Register here</a>';

  document.getElementById("switchLink").onclick = toggleForm;
  showMessage("");
}

switchLink.onclick = toggleForm;

async function request(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "same-origin",
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong");
  }

  return result;
}

function showDashboard(student) {
  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");

  document.getElementById("studentName").textContent = student.name;
  document.getElementById("displayName").textContent = student.name;
  document.getElementById("displayEmail").textContent = student.email;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    showMessage("Logging in...");

    const result = await request("/api/login", {
      email: document.getElementById("loginEmail").value,
      password: document.getElementById("loginPassword").value
    });

    showDashboard(result.student);

  } catch (error) {
    showMessage(error.message);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    showMessage("Creating account...");

    const result = await request("/api/register", {
      name: document.getElementById("name").value,
      email: document.getElementById("regEmail").value,
      password: document.getElementById("regPassword").value
    });

    showDashboard(result.student);

  } catch (error) {
    showMessage(error.message);
  }
});

document.getElementById("logoutButton")
  .addEventListener("click", async () => {
    try {
      await request("/api/logout", {});
      dashboard.classList.add("hidden");
      authSection.classList.remove("hidden");
      loginForm.reset();
      registerForm.reset();
      showLoginForm();
    } catch (error) {
      alert(error.message);
    }
  });

// Check whether student is already logged in
async function checkLogin() {
  try {
    const response = await fetch("/api/me", {
      credentials: "same-origin"
    });

    if (response.ok) {
      const result = await response.json();
      showDashboard(result.student);
    }
  } catch (error) {
    console.error(error);
  }
}

checkLogin();
