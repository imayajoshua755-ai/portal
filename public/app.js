
// STUDENT PORTAL JAVASCRIPT

const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const formTitle = document.getElementById("formTitle");
const message = document.getElementById("message");
const switchText = document.getElementById("switchText");

const serviceDetails = document.getElementById("serviceDetails");
const servicesGrid = document.querySelector(".services-grid");


// SHOW MESSAGES

function showMessage(text) {
  message.textContent = text;
}


// LOGIN AND REGISTRATION SWITCH

function setAuthMode(registering) {

  loginForm.classList.toggle("hidden", registering);
  registerForm.classList.toggle("hidden", !registering);

  formTitle.textContent = registering
    ? "Student Registration"
    : "Student Login";

  switchText.innerHTML = registering
    ? 'Already have an account? <a href="#" id="switchLink">Login here</a>'
    : 'Don\'t have an account? <a href="#" id="switchLink">Register here</a>';

  showMessage("");

  document.getElementById("switchLink")
    .addEventListener("click", function(event) {
      event.preventDefault();
      setAuthMode(!registering);
    });
}

setAuthMode(false);


// SERVER REQUEST FUNCTION

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


// SHOW STUDENT DASHBOARD

function showDashboard(student) {

  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");

  document.getElementById("studentName").textContent =
    student.name;

  document.getElementById("displayName").textContent =
    student.name;

  document.getElementById("displayEmail").textContent =
    student.email;

  // Show all four services

  servicesGrid.classList.remove("hidden");

  // Hide previously opened service

  serviceDetails.classList.add("hidden");
}


// STUDENT LOGIN

loginForm.addEventListener("submit", async function(event) {

  event.preventDefault();

  try {

    showMessage("Logging in...");

    const result = await request("/api/login", {

      email: document.getElementById("loginEmail").value,

      password: document.getElementById("loginPassword").value

    });

    loginForm.reset();

    showDashboard(result.student);

  } catch (error) {

    showMessage(error.message);

  }

});


// STUDENT REGISTRATION

registerForm.addEventListener("submit", async function(event) {

  event.preventDefault();

  try {

    showMessage("Creating your account...");

    const result = await request("/api/register", {

      name: document.getElementById("name").value,

      email: document.getElementById("regEmail").value,

      password: document.getElementById("regPassword").value

    });

    registerForm.reset();

    showDashboard(result.student);

  } catch (error) {

    showMessage(error.message);

  }

});


// FOUR STUDENT SERVICES

const services = {

  academics: {

    title: "📚 ACADEMICS",

    content: `
      <h3>Academic Information</h3>

      <p>Welcome to your academic section.</p>

      <ul>
        <li>Registered Courses</li>
        <li>Examination Results</li>
        <li>Academic Transcripts</li>
        <li>Academic Progress</li>
        <li>Course Registration</li>
      </ul>

      <p>
        Your academic records will appear here once
        connected to the academic records database.
      </p>
    `

  },


  fees: {

    title: "💳 FEES MANAGEMENT",

    content: `
      <h3>Student Financial Information</h3>

      <p>Manage and view your fee information.</p>

      <ul>
        <li>Fee Statements</li>
        <li>Fee Balances</li>
        <li>Payment History</li>
        <li>Payment Information</li>
        <li>Outstanding Fees</li>
      </ul>

      <p>
        Your actual fee statements and payment records
        will appear here once connected to the finance database.
      </p>
    `

  },


  accommodation: {

    title: "🏠 ACCOMMODATION",

    content: `
      <h3>Student Accommodation</h3>

      <p>Manage your hostel and accommodation information.</p>

      <ul>
        <li>Hostel Information</li>
        <li>Room Allocation</li>
        <li>Accommodation Application</li>
        <li>Accommodation Status</li>
        <li>Hostel Payment Information</li>
      </ul>

      <p>
        Your room allocation and accommodation details
        will appear here once connected to the accommodation database.
      </p>
    `

  },


  graduation: {

    title: "🎓 GRADUATION TRACKER",

    content: `
      <h3>Graduation Progress</h3>

      <p>Monitor your academic journey towards graduation.</p>

      <ul>
        <li>Course Completion</li>
        <li>Academic Requirements</li>
        <li>Outstanding Units</li>
        <li>Graduation Eligibility</li>
        <li>Graduation Application Status</li>
      </ul>

      <p>
        Your graduation progress will appear here
        once your academic records are connected.
      </p>
    `

  }

};


// OPEN A SERVICE

document.querySelectorAll(".service-card").forEach(card => {

  card.addEventListener("click", function() {

    const page = card.dataset.page;

    const service = services[page];

    if (!service) return;

    document.getElementById("serviceTitle").textContent =
      service.title;

    document.getElementById("serviceContent").innerHTML =
      service.content;

    servicesGrid.classList.add("hidden");

    serviceDetails.classList.remove("hidden");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

});


// RETURN TO DASHBOARD

document.getElementById("backButton")
  .addEventListener("click", function() {

    serviceDetails.classList.add("hidden");

    servicesGrid.classList.remove("hidden");

  });


// STUDENT LOGOUT

document.getElementById("logoutButton")
  .addEventListener("click", async function() {

    try {

      await request("/api/logout", {});

      dashboard.classList.add("hidden");

      authSection.classList.remove("hidden");

      loginForm.reset();

      registerForm.reset();

      setAuthMode(false);

    } catch (error) {

      alert(error.message);

    }

  });


// CHECK IF STUDENT IS ALREADY LOGGED IN

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

    console.error("Login check failed:", error);

  }

}


// START APPLICATION

checkLogin();
