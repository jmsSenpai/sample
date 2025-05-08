document.addEventListener("DOMContentLoaded", function () {
    // --- Helper Functions ---
    function showMessage(message, autoClose = false) {
      const messageModal = document.getElementById("messageModal");
      const messageText = document.getElementById("messageText");
      if (messageText && messageModal) {
        messageText.innerText = message;
        const successKeywords = ["successful", "created", "verified", "sent"];
        const isSuccess = successKeywords.some(keyword => message.toLowerCase().includes(keyword));
        messageModal.classList.remove('success', 'error');
        messageModal.classList.add(isSuccess ? 'success' : 'error');
        messageModal.style.display = "block";
        if (autoClose) {
          setTimeout(() => {
            messageModal.style.display = "none";
            messageModal.classList.remove('success', 'error');
          }, 2000);
        }
      } else {
        console.error("Message modal or text element not found");
      }
    }
  
    function closeModals() {
      const forgotModal = document.getElementById("forgotModal");
      const securityFields = document.getElementById("security-fields");
      const verificationFields = document.getElementById("verification-fields");
      const passwordFields = document.getElementById("password-fields");
      const messageModal = document.getElementById("messageModal");
      if (forgotModal) forgotModal.style.display = "none";
      if (messageModal) messageModal.style.display = "none";
      if (securityFields) securityFields.style.display = "block";
      if (verificationFields) verificationFields.style.display = "none";
      if (passwordFields) passwordFields.style.display = "none";
      currentStage = 'initial';
      verificationCode = null;
      codeExpiration = null;
      currentUsername = null;
      attempts = 0;
      const inputs = [
        "forgot-email",
        "forgot-question",
        "forgot-answer",
        "verification-code",
        "new-password",
        "reset-confirm-password",
      ];
      inputs.forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = "";
      });
      const questionInput = document.getElementById("forgot-question");
      const answerInput = document.getElementById("forgot-answer");
      if (questionInput) questionInput.style.display = "none";
      if (answerInput) answerInput.style.display = "none";
    }
  
    function isAnyModalOpen() {
      const forgotModal = document.getElementById("forgotModal");
      const messageModal = document.getElementById("messageModal");
      return (
        (forgotModal && forgotModal.style.display === "block") ||
        (messageModal && messageModal.style.display === "block")
      );
    }
  
    function isValidPassword(password) {
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      return passwordPattern.test(password);
    }
  
    function generateVerificationCode() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  
    async function sendVerificationCode(email, username) {
      console.log(`Sending verification code to ${email} for username ${username}`);
      verificationCode = generateVerificationCode();
      codeExpiration = new Date().getTime() + 120000; // 2 minutes from now
  
      try {
        const response = await fetch('http://localhost:3000/send-verification-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentEmail: email,
            studentName: username,
            verificationCode: verificationCode
          })
        });
  
        const result = await response.json();
        if (response.ok) {
          showMessage("Verification code sent to your email.", true);
          return true;
        } else {
          showMessage(result.error || "Failed to send verification code.");
          return false;
        }
      } catch (error) {
        console.error("Error sending verification code:", error);
        showMessage("Error sending verification code.");
        return false;
      }
    }
  
    // --- Login Function ---
    function handleLogin(event) {
      event.preventDefault();
      if (isAnyModalOpen()) {
        showMessage("Please close all open modals first.");
        return;
      }
  
      const adminEmailInput = document.getElementById("admin-email");
      const adminPassInput = document.getElementById("admin-pass");
      const inputUsername = adminEmailInput.value.trim();
      const password = adminPassInput.value;
      const now = new Date().getTime();
  
      if (signInLockedUntil && now < signInLockedUntil) {
        const seconds = Math.ceil((signInLockedUntil - now) / 1000);
        showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
        return;
      }
  
      let adminData = JSON.parse(localStorage.getItem(inputUsername));
  
      if (adminData && adminData.accountType === "admin") {
        if (adminData.password === password) {
          localStorage.setItem("loggedInAdmin", inputUsername);
          showMessage("Login successful!", true);
          setTimeout(() => (window.location.href = "admin-dashboard.html"), 2000);
        } else {
          showMessage("Incorrect password.");
          adminPassInput.select();
          signInAttempts++;
          if (signInAttempts >= 5) {
            signInLockedUntil = now + 60000;
            showMessage("Too many failed attempts. Try again in 1 minute.");
          }
          adminPassInput.value = "";
        }
      } else {
        showMessage("No account found with this username.");
        adminEmailInput.value = "";
        adminPassInput.value = "";
        signInAttempts++;
        if (signInAttempts >= 5) {
          signInLockedUntil = now + 60000;
          showMessage("Too many failed attempts. Try again in 1 minute.");
        }
      }
    }
  
    // --- Forgot Password Function ---
    async function handleForgotPassword() {
      const username = document.getElementById("forgot-email").value.trim();
      const question = document.getElementById("forgot-question").value.trim();
      const answer = document.getElementById("forgot-answer").value.trim();
      const inputCode = document.getElementById("verification-code").value.trim();
      const newPassword = document.getElementById("new-password").value.trim();
      const confirmPassword = document.getElementById("reset-confirm-password").value.trim();
      const now = new Date().getTime();
  
      console.log(`handleForgotPassword called, currentStage: ${currentStage}`);
  
      if (forgotLockedUntil && now < forgotLockedUntil) {
        const seconds = Math.ceil((forgotLockedUntil - now) / 1000);
        showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
        return;
      }
  
      if (currentStage === 'security') {
        if (!question || !answer) {
          showMessage("Please fill in the security question and answer.");
          return;
        }
  
        const adminData = JSON.parse(localStorage.getItem(currentUsername));
        if (!adminData) {
          showMessage("Account not found. Please start over.");
          closeModals();
          return;
        }
  
        if (adminData.securityQuestion.toLowerCase() === question.toLowerCase() && adminData.securityAnswer.toLowerCase() === answer.toLowerCase()) {
          currentStage = 'password';
          document.getElementById("security-fields").style.display = "none";
          document.getElementById("password-fields").style.display = "block";
          showMessage("Security question verified. Please enter your new password.", true);
        } else {
          forgotAttempts++;
          if (forgotAttempts >= 5) {
            forgotLockedUntil = now + 60000;
            showMessage("Too many failed attempts. Try again in 1 minute.");
          } else {
            showMessage(`Incorrect security answer. Attempts left: ${5 - forgotAttempts}`);
          }
        }
      } else if (currentStage === 'code') {
        if (!inputCode) {
          showMessage("Please enter the verification code.");
          return;
        }
  
        if (now > codeExpiration) {
          showMessage("Verification code has expired. Please request a new one.");
          verificationCode = null;
          codeExpiration = null;
          document.getElementById("verification-code").value = "";
          return;
        }
  
        if (inputCode === verificationCode) {
          currentStage = 'password';
          document.getElementById("verification-fields").style.display = "none";
          document.getElementById("password-fields").style.display = "block";
          showMessage("Verification code confirmed. Please enter your new password.", true);
        } else {
          showMessage("Invalid verification code.");
          document.getElementById("verification-code").value = "";
        }
      } else if (currentStage === 'password') {
        if (!newPassword || !confirmPassword) {
          showMessage("Please enter and confirm your new password.");
          return;
        }
  
        if (newPassword !== confirmPassword) {
          showMessage("Passwords do not match.");
          return;
        }
  
        if (!isValidPassword(newPassword)) {
          showMessage(
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long."
          );
          return;
        }
  
        const adminData = JSON.parse(localStorage.getItem(currentUsername));
        if (!adminData) {
          showMessage("Account not found. Please start over.");
          closeModals();
          return;
        }
  
        adminData.password = newPassword;
        localStorage.setItem(currentUsername, JSON.stringify(adminData));
        showMessage("Password reset successful.", true);
        closeModals();
      }
    }
  
    // --- Create Account Function ---
    function handleCreateAccount(event) {
      event.preventDefault();
  
      const lastName = document.getElementById("lastName").value.trim();
      const firstName = document.getElementById("firstName").value.trim();
      const middleName = document.getElementById("middleName").value.trim();
      const username = document.getElementById("username").value.trim();
      const gmail = document.getElementById("gmail").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const securityQuestion = document.getElementById("security-question").value.trim();
      const securityAnswer = document.getElementById("security-answer").value.trim();
  
      if (!lastName || !firstName || !username || !gmail) {
        showMessage("Please fill in all required fields (Last Name, First Name, Username, Gmail).");
        return;
      }
  
      const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!gmailPattern.test(gmail)) {
        showMessage("Please enter a valid Gmail address (e.g., example@gmail.com).");
        return;
      }
  
      if (localStorage.getItem(username)) {
        showMessage("An account with this username already exists.");
        return;
      }
  
      if (!isValidPassword(password)) {
        showMessage(
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long."
        );
        return;
      }
  
      if (password !== confirmPassword) {
        showMessage("Passwords do not match!");
        return;
      }
  
      if (!securityQuestion || !securityAnswer) {
        showMessage("Please provide a security question and answer.");
        return;
      }
  
      const adminAccount = {
        lastName,
        firstName,
        middleName,
        username,
        gmail,
        password,
        securityQuestion,
        securityAnswer,
        accountType: "admin",
      };
  
      localStorage.setItem(username, JSON.stringify(adminAccount));
      showMessage("Admin account created successfully!", true);
      document.querySelector(".create-account-form").reset();
      window.location.href = "admin-adminAccount.html";
    }
  
    // --- Display Admin Accounts Function ---
    function loadAdminAccounts() {
      const accountsTable = document.querySelector(".accounts-table");
      if (!accountsTable) return;
  
      accountsTable.innerHTML = `
        <div class="table-header">
          <div class="header-item">Name</div>
          <div class="header-item">Username</div>
          <div class="header-item">Gmail</div>
          <div class="header-item">Actions</div>
        </div>
      `;
  
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === "loggedInAdmin") continue;
  
        let adminData;
        try {
          adminData = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          console.warn(`Skipping invalid JSON for key: ${key}`);
          continue;
        }
  
        if (adminData && typeof adminData === "object" && adminData.accountType === "admin") {
          const row = document.createElement("div");
          row.className = "table-row";
  
          const fullName = `${adminData.firstName} ${
            adminData.middleName ? adminData.middleName + " " : ""
          }${adminData.lastName}`;
  
          row.innerHTML = `
            <div class="row-item">${fullName}</div>
            <div class="row-item">${adminData.username}</div>
            <div class="row-item">${adminData.gmail}</div>
            <div class="row-item actions">
              <button class="delete-btn" data-username="${adminData.username}">Delete</button>
            </div>
          `;
  
          accountsTable.appendChild(row);
        }
      }
  
      const deleteButtons = document.querySelectorAll(".delete-btn");
      deleteButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const username = this.getAttribute("data-username");
          localStorage.removeItem(username);
          showMessage(`Admin account with username ${username} has been deleted.`, true);
          loadAdminAccounts();
        });
      });
    }
  
    // --- Initialize State ---
    let signInAttempts = 0;
    let signInLockedUntil = null;
    let forgotAttempts = 0;
    let forgotLockedUntil = null;
    let currentStage = 'initial';
    let verificationCode = null;
    let codeExpiration = null;
    let currentUsername = null;
  
    // --- Update Nav Footer ---
    const loggedInAdminUsername = localStorage.getItem("loggedInAdmin");
    if (loggedInAdminUsername) {
      try {
        const adminData = JSON.parse(localStorage.getItem(loggedInAdminUsername));
        if (adminData && adminData.accountType === "admin") {
          const fullName = `${adminData.firstName}`;
          const navFooterTitle = document.getElementById("nav-footer-title");
          if (navFooterTitle) {
            navFooterTitle.textContent = fullName;
            navFooterTitle.href = "#";
          }
        }
      } catch (e) {
        console.warn(`Invalid admin data for ${loggedInAdminUsername}`);
      }
    }
  
    // --- Logout Functionality ---
    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
      logoutButton.addEventListener("click", function () {
        document.body.classList.add("fade-out");
        setTimeout(function () {
          localStorage.removeItem("loggedInAdmin");
          const inputs = document.querySelectorAll("input");
          inputs.forEach((input) => (input.value = ""));
          window.location.href = "admin-login.html";
        }, 1000);
      });
    }
  
    // --- Password Toggle Functionality ---
    document.querySelectorAll(".toggle-password").forEach(toggle => {
      toggle.addEventListener("click", () => {
        const targetId = toggle.getAttribute("data-target");
        const input = document.getElementById(targetId);
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        toggle.textContent = isPassword ? "Hide" : "Show";
      });
    });
  
    // --- Event Listeners ---
    const signInForm = document.getElementById("signInForm");
    if (signInForm) {
      signInForm.addEventListener("submit", handleLogin);
    }
  
    const createButton = document.querySelector(".create-btn");
    if (createButton) {
      createButton.addEventListener("click", handleCreateAccount);
    }
  
    const forgotLink = document.getElementById("forgotLink");
    if (forgotLink) {
      forgotLink.addEventListener("click", function (e) {
        e.preventDefault();
        const forgotModal = document.getElementById("forgotModal");
        if (forgotModal) {
          forgotModal.style.display = "block";
          document.getElementById("security-fields").style.display = "block";
          document.getElementById("verification-fields").style.display = "none";
          document.getElementById("password-fields").style.display = "none";
          const questionInput = document.getElementById("forgot-question");
          const answerInput = document.getElementById("forgot-answer");
          if (questionInput) questionInput.style.display = "none";
          if (answerInput) answerInput.style.display = "none";
          currentStage = 'initial';
          forgotAttempts = 0;
        } else {
          console.error("Forgot modal not found");
        }
      });
    }
  
    const getOtpBtn = document.getElementById("getOtpBtn");
    if (getOtpBtn) {
      getOtpBtn.addEventListener("click", async function () {
        console.log("Get OTP button clicked");
        const username = document.getElementById("forgot-email").value.trim();
        const now = new Date().getTime();
  
        if (forgotLockedUntil && now < forgotLockedUntil) {
          const seconds = Math.ceil((forgotLockedUntil - now) / 1000);
          showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
          return;
        }
  
        if (!username) {
          showMessage("Please enter your username.");
          return;
        }
  
        const adminData = JSON.parse(localStorage.getItem(username));
        if (!adminData || adminData.accountType !== "admin") {
          showMessage("No admin account found with this username.");
          return;
        }
  
        currentUsername = username;
        currentStage = 'code';
        document.getElementById("security-fields").style.display = "none";
        document.getElementById("verification-fields").style.display = "block";
        const success = await sendVerificationCode(adminData.gmail, username);
        if (!success) {
          currentStage = 'initial';
          document.getElementById("security-fields").style.display = "block";
          document.getElementById("verification-fields").style.display = "none";
        }
      });
    } else {
      console.error("Get OTP button not found");
    }
  
    const securityQuestionBtn = document.getElementById("securityQuestionBtn");
    if (securityQuestionBtn) {
      securityQuestionBtn.addEventListener("click", function () {
        console.log("Security Question button clicked");
        const username = document.getElementById("forgot-email").value.trim();
  
        if (!username) {
          showMessage("Please enter your username.");
          return;
        }
  
        const adminData = JSON.parse(localStorage.getItem(username));
        if (!adminData || adminData.accountType !== "admin") {
          showMessage("No admin account found with this username.");
          return;
        }
  
        currentUsername = username;
        currentStage = 'security';
        const questionInput = document.getElementById("forgot-question");
        const answerInput = document.getElementById("forgot-answer");
        if (questionInput) questionInput.style.display = "block";
        if (answerInput) answerInput.style.display = "block";
        showMessage("Please answer the security question.", true);
      });
    } else {
      console.error("Security Question button not found");
    }
  
    const resetPasswordBtn = document.getElementById("resetPassword");
    if (resetPasswordBtn) {
      resetPasswordBtn.addEventListener("click", handleForgotPassword);
    } else {
      console.error("Reset Password button not found");
    }
  
    const resendCodeBtn = document.getElementById("resendCode");
    if (resendCodeBtn) {
      resendCodeBtn.addEventListener("click", async function () {
        if (currentStage !== 'code') return;
  
        const adminData = JSON.parse(localStorage.getItem(currentUsername));
  
        if (!adminData) {
          showMessage("No account found with this username.");
          closeModals();
          return;
        }
  
        const success = await sendVerificationCode(adminData.gmail, currentUsername);
        if (success) {
          document.getElementById("verification-fields").style.display = "block";
        }
      });
    } else {
      console.error("Resend Code button not found");
    }
  
    const closeModalBtn = document.getElementById("closeModal");
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", closeModals);
    } else {
      console.error("Close Modal button not found");
    }
  
    const closeMessageModal = document.getElementById("closeMessageModal");
    if (closeMessageModal) {
      closeMessageModal.addEventListener("click", () => {
        const messageModal = document.getElementById("messageModal");
        if (messageModal) {
          messageModal.style.display = "none";
          messageModal.classList.remove('success', 'error');
        }
      });
    } else {
      console.error("Close Message Modal button not found");
    }
  
    window.addEventListener("click", function (event) {
      const forgotModal = document.getElementById("forgotModal");
      const messageModal = document.getElementById("messageModal");
      if (event.target === forgotModal) {
        closeModals();
      } else if (event.target === messageModal) {
        messageModal.style.display = "none";
        messageModal.classList.remove('success', 'error');
      }
    });
  
    document.addEventListener("keydown", function (event) {
      const forgotModal = document.getElementById("forgotModal");
      const messageModal = document.getElementById("messageModal");
      if (event.key === "Enter" && messageModal && messageModal.style.display === "block") {
        messageModal.style.display = "none";
        messageModal.classList.remove('success', 'error');
      } else if (event.key === "Enter" && forgotModal && forgotModal.style.display === "block") {
        const resetPasswordBtn = document.getElementById("resetPassword");
        if (resetPasswordBtn) resetPasswordBtn.click();
      }
    });
  
    // --- Load Admin Accounts ---
    loadAdminAccounts();
});