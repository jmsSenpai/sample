document.addEventListener("DOMContentLoaded", function () {
    let signInAttempts = 0;
    let signInLockoutLevel = 0;
    let signInLockedUntil = null;
    let forgotAttempts = 0;
    let forgotLockoutLevel = 0;
    let forgotLockedUntil = null;
    let currentStage = 'initial';
    let verificationCode = null;
    let codeExpiration = null;
    let currentUsername = null;
    let lastEmailSent = null;

    const lockoutDurations = [60000, 180000, 600000, 1800000]; // 1min, 3min, 10min, 30min

    function getLockoutDuration(level) {
        return lockoutDurations[Math.min(level, lockoutDurations.length - 1)];
    }

    function showMessage(message, autoClose = false, isSuccess = false) {
        console.log(`Showing message: "${message}", isSuccess: ${isSuccess}`);
        Swal.fire({
            text: message,
            icon: isSuccess ? 'success' : 'error',
            showConfirmButton: !autoClose,
            timer: autoClose ? 2000 : undefined,
            timerProgressBar: autoClose,
            customClass: {
                popup: isSuccess ? 'swal-success' : 'swal-error'
            }
        });
    }

    function closeModals() {
        const forgotModal = document.getElementById("forgotModal");
        const securityFields = document.getElementById("security-fields");
        const verificationFields = document.getElementById("verification-fields");
        const passwordFields = document.getElementById("password-fields");
        if (forgotModal) forgotModal.style.display = "none";
        if (securityFields) securityFields.style.display = "block";
        if (verificationFields) verificationFields.style.display = "none";
        if (passwordFields) passwordFields.style.display = "none";
        currentStage = 'initial';
        verificationCode = null;
        codeExpiration = null;
        currentUsername = null;
        lastEmailSent = null;
        forgotAttempts = 0;
        forgotLockoutLevel = 0;
        forgotLockedUntil = null;
        signInAttempts = 0;
        signInLockoutLevel = 0;
        signInLockedUntil = null;
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
        return (
            (forgotModal && forgotModal.style.display === "block") ||
            Swal.isVisible()
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
        codeExpiration = new Date().getTime() + 120000;
        lastEmailSent = new Date().getTime();

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
                showMessage("Verification code sent to your email.", true, true);
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

    function handleLogin(event) {
        event.preventDefault();
        if (isAnyModalOpen()) {
            showMessage("Please close all open modals or alerts first.");
            return;
        }

        const adminEmailInput = document.getElementById("admin-email");
        const adminPassInput = document.getElementById("admin-pass");
        const inputValue = adminEmailInput.value.trim();
        const password = adminPassInput.value;
        const now = new Date().getTime();

        if (signInLockedUntil && now < signInLockedUntil) {
            const seconds = Math.ceil((signInLockedUntil - now) / 1000);
            showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
            return;
        }

        if (!inputValue || !password) {
            showMessage("Please enter username/Gmail and password.");
            return;
        }

        let adminData = null;
        let matchedUsername = null;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key === "loggedInAdmin") continue;

            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (
                    data.accountType === "admin" &&
                    (data.username === inputValue || data.gmail === inputValue)
                ) {
                    adminData = data;
                    matchedUsername = key;
                    break;
                }
            } catch (e) {
                console.warn(`Skipping invalid JSON for key: ${key}`);
                continue;
            }
        }

        if (adminData) {
            if (adminData.password === password) {
                localStorage.setItem("loggedInAdmin", matchedUsername);
                showMessage("Login successful!", true, true);
                setTimeout(() => (window.location.href = "admin-dashboard.html"), 2000);
            } else {
                showMessage("Incorrect password.");
                adminPassInput.select();
                signInAttempts++;
                if (signInAttempts % 5 === 0) {
                    signInLockoutLevel++;
                    signInLockedUntil = now + getLockoutDuration(signInLockoutLevel);
                    const seconds = getLockoutDuration(signInLockoutLevel) / 1000;
                    showMessage(`Too many failed attempts. Try again in ${seconds} second(s).`);
                }
                adminPassInput.value = "";
            }
        } else {
            showMessage("No account found with this username or Gmail.");
            adminEmailInput.value = "";
            adminPassInput.value = "";
            signInAttempts++;
            if (signInAttempts % 5 === 0) {
                signInLockoutLevel++;
                signInLockedUntil = now + getLockoutDuration(signInLockoutLevel);
                const seconds = getLockoutDuration(signInLockoutLevel) / 1000;
                showMessage(`Too many failed attempts. Try again in ${seconds} second(s).`);
            }
        }
    }

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

        if (currentStage === 'initial') {
            if (!username) {
                showMessage("Please enter your username or Gmail.");
                return;
            }

            let adminData = null;
            let matchedUsername = null;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key === "loggedInAdmin") continue;

                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (
                        data.accountType === "admin" &&
                        (data.username === username || data.gmail === username)
                    ) {
                        adminData = data;
                        matchedUsername = key;
                        break;
                    }
                } catch (e) {
                    console.warn(`Skipping invalid JSON for key: ${key}`);
                    continue;
                }
            }

            if (!adminData || adminData.accountType !== "admin") {
                showMessage("No admin account found with this username or Gmail.");
                return;
            }

            currentUsername = matchedUsername;
        } else if (currentStage === 'security') {
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
                showMessage("Security question verified. Please enter your new password.", true, true);
            } else {
                forgotAttempts++;
                if (forgotAttempts % 5 === 0) {
                    forgotLockoutLevel++;
                    forgotLockedUntil = now + getLockoutDuration(forgotLockoutLevel);
                    const seconds = getLockoutDuration(forgotLockoutLevel) / 1000;
                    showMessage(`Too many failed attempts. Try again in ${seconds} second(s).`);
                } else {
                    showMessage(`Incorrect security answer. Attempts left: ${5 - (forgotAttempts % 5)}`);
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
                showMessage("Verification code verified. Please enter your new password.", true, true);
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

            const updatedData = JSON.parse(localStorage.getItem(currentUsername));
            if (updatedData && updatedData.password === newPassword) {
                showMessage("Password reset successful.", true, true);
                closeModals();
            } else {
                showMessage("Failed to reset password. Please try again.");
            }
        }
    }

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
        showMessage("Admin account created successfully!", true, true);
        setTimeout(() => {
            window.location.href = "admin-adminAccount.html";
        }, 2000);
        document.querySelector(".create-account-form").reset();
    }

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
                Swal.fire({
                    title: 'Are you sure?',
                    text: `Do you want to delete the admin account with username "${username}"?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, delete it!'
                }).then((result) => {
                    if (result.isConfirmed) {
                        localStorage.removeItem(username);
                        showMessage(`Admin account with username ${username} has been deleted.`, true, true);
                        loadAdminAccounts();
                    }
                });
            });
        });
    }

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

    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            Swal.fire({
                title: "Are you sure?",
                text: "Do you want to log out?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes, log out",
                cancelButtonText: "Cancel",
                customClass: {
                    popup: 'swal-warning'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    console.log("Logout confirmed, proceeding...");
                    document.body.classList.add("fade-out");
                    setTimeout(function () {
                        localStorage.removeItem("loggedInAdmin");
                        document.querySelectorAll("input").forEach((input) => (input.value = ""));
                        window.location.href = "admin-login.html";
                    }, 1000);
                } else {
                    console.log("Logout cancelled by user.");
                }
            });
        });
    }

    document.querySelectorAll(".toggle-password").forEach(toggle => {
        toggle.addEventListener("click", () => {
            const targetId = toggle.getAttribute("data-target");
            const input = document.getElementById(targetId) || toggle.previousElementSibling;
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            toggle.textContent = isPassword ? "Hide" : "Show";
        });
    });

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
                forgotLockoutLevel = 0;
                forgotLockedUntil = null;
            } else {
                console.error("Forgot modal not found");
            }
        });
    }

    const getOtpBtn = document.getElementById("getOtpBtn");
    if (getOtpBtn) {
        getOtpBtn.addEventListener("click", async function () {
            console.log("Get OTP button clicked");
            const inputValue = document.getElementById("forgot-email").value.trim();
            const now = new Date().getTime();

            if (forgotLockedUntil && now < forgotLockedUntil) {
                const seconds = Math.ceil((forgotLockedUntil - now) / 1000);
                showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
                return;
            }

            if (lastEmailSent && now < lastEmailSent + 120000) {
                const seconds = Math.ceil((lastEmailSent + 120000 - now) / 1000);
                showMessage(`Please wait ${seconds} second(s) before requesting another code.`);
                return;
            }

            if (!inputValue) {
                showMessage("Please enter your username or Gmail.");
                return;
            }

            let adminData = null;
            let matchedUsername = null;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key === "loggedInAdmin") continue;

                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (
                        data.accountType === "admin" &&
                        (data.username === inputValue || data.gmail === inputValue)
                    ) {
                        adminData = data;
                        matchedUsername = key;
                        break;
                    }
                } catch (e) {
                    console.warn(`Skipping invalid JSON for key: ${key}`);
                    continue;
                }
            }

            if (!adminData || adminData.accountType !== "admin") {
                showMessage("No admin account found with this username or Gmail.");
                return;
            }

            currentUsername = matchedUsername;
            currentStage = 'code';
            document.getElementById("security-fields").style.display = "none";
            document.getElementById("verification-fields").style.display = "block";
            const success = await sendVerificationCode(adminData.gmail, matchedUsername);
            if (!success) {
                currentStage = 'initial';
                document.getElementById("security-fields").style.display = "block";
                document.getElementById("verification-fields").style.display = "none";
                lastEmailSent = null;
            }
        });
    }

    const securityQuestionBtn = document.getElementById("securityQuestionBtn");
    if (securityQuestionBtn) {
        securityQuestionBtn.addEventListener("click", function () {
            console.log("Security Question button clicked");
            const inputValue = document.getElementById("forgot-email").value.trim();

            if (!inputValue) {
                showMessage("Please enter your username or Gmail.");
                return;
            }

            let adminData = null;
            let matchedUsername = null;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key === "loggedInAdmin") continue;

                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (
                        data.accountType === "admin" &&
                        (data.username === inputValue || data.gmail === inputValue)
                    ) {
                        adminData = data;
                        matchedUsername = key;
                        break;
                    }
                } catch (e) {
                    console.warn(`Skipping invalid JSON for key: ${key}`);
                    continue;
                }
            }

            if (!adminData || adminData.accountType !== "admin") {
                showMessage("No admin account found with this username or Gmail.");
                return;
            }

            currentUsername = matchedUsername;
            currentStage = 'security';
            const questionInput = document.getElementById("forgot-question");
            const answerInput = document.getElementById("forgot-answer");
            if (questionInput) questionInput.style.display = "block";
            if (answerInput) answerInput.style.display = "block";
            showMessage("Please answer the security question.", true, true);
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

            const now = new Date().getTime();
            if (forgotLockedUntil && now < forgotLockedUntil) {
                const seconds = Math.ceil((forgotLockedUntil - now) / 1000);
                showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
                return;
            }

            if (lastEmailSent && now < lastEmailSent + 120000) {
                const seconds = Math.ceil((lastEmailSent + 120000 - now) / 1000);
                showMessage(`Please wait ${seconds} second(s) before requesting another code.`);
                return;
            }

            const adminData = JSON.parse(localStorage.getItem(currentUsername));
            if (!adminData) {
                showMessage("No account found with this username.");
                closeModals();
                return;
            }

            const success = await sendVerificationCode(adminData.gmail, currentUsername);
            if (success) {
                document.getElementById("verification-fields").style.display = "block";
            } else {
                lastEmailSent = null;
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

    window.addEventListener("click", function (event) {
        const forgotModal = document.getElementById("forgotModal");
        if (event.target === forgotModal) {
            closeModals();
        }
    });

    document.addEventListener("keydown", function (event) {
        const forgotModal = document.getElementById("forgotModal");
        const resetPasswordBtn = document.getElementById("resetPassword");
        if (event.key === "Enter" && forgotModal && forgotModal.style.display === "block") {
            if (resetPasswordBtn) resetPasswordBtn.click();
        }
    });

    loadAdminAccounts();
});