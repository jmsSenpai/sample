function isValidPassword(password) {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordPattern.test(password);
}

document.addEventListener("DOMContentLoaded", function () {
    const signUpForm = document.querySelector('#signUpForm');
    const signInForm = document.querySelector('#signInForm');
    const forgotLink = document.getElementById('forgotLink');
    const forgotModal = document.getElementById('forgotModal');
    const closeModal = document.getElementById('closeModal');
    const resetPasswordBtn = document.getElementById('resetPassword');
    const passwordFields = document.getElementById("password-fields");
    const verificationFields = document.getElementById("verification-fields");
    const securityFields = document.getElementById("security-fields");
    const resendCodeBtn = document.getElementById("resendCode");
    const messageModal = document.getElementById("messageModal");
    const messageText = document.getElementById("messageText");
    const closeMessageModal = document.getElementById("closeMessageModal");
    const studentEmailInput = document.getElementById('student-email');
    const studentPassInput = document.getElementById('student-pass');

    let attempts = 0;
    let lockedUntil = null;
    let currentStage = 'initial';
    let verificationCode = null;
    let codeExpiration = null;
    let currentUsername = null;

    function showMessage(message, autoClose = false) {
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
        return (
            (forgotModal && forgotModal.style.display === "block") ||
            (messageModal && messageModal.style.display === "block")
        );
    }

    function generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async function sendVerificationCode(email, username) {
        console.log(`Sending verification code to ${email} for username ${username}`);
        verificationCode = generateVerificationCode();
        codeExpiration = new Date().getTime() + 120000;

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

    async function handleForgotPassword() {
        const username = document.getElementById("forgot-email").value.trim();
        const question = document.getElementById("forgot-question").value.trim();
        const answer = document.getElementById("forgot-answer").value.trim();
        const inputCode = document.getElementById("verification-code").value.trim();
        const newPassword = document.getElementById("new-password").value.trim();
        const confirmPassword = document.getElementById("reset-confirm-password").value.trim();
        const now = new Date().getTime();

        console.log(`handleForgotPassword called, currentStage: ${currentStage}, question: ${question}`);

        if (lockedUntil && now < lockedUntil) {
            const seconds = Math.ceil((lockedUntil - now) / 1000);
            showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
            return;
        }

        if (currentStage === 'initial') {
            if (!username) {
                showMessage("Please enter your username.");
                return;
            }

            const studentData = JSON.parse(localStorage.getItem(username));
            if (!studentData || studentData.accountType !== "student") {
                showMessage("No student account found with this username.");
                return;
            }
        } else if (currentStage === 'security') {
            if (!question || !answer) {
                showMessage("Please enter the security question and answer.");
                return;
            }

            const studentData = JSON.parse(localStorage.getItem(currentUsername));
            if (!studentData) {
                showMessage("Account not found. Please start over.");
                closeModals();
                return;
            }

            console.log(`Comparing questions: stored=${studentData.securityQuestion}, input=${question}`);
            if (
                studentData.securityQuestion.toLowerCase() === question.toLowerCase() &&
                studentData.securityAnswer.toLowerCase() === answer.toLowerCase()
            ) {
                currentStage = 'password';
                securityFields.style.display = "none";
                passwordFields.style.display = "block";
                showMessage("Security question verified. Please enter your new password.", true);
            } else {
                attempts++;
                if (attempts >= 5) {
                    lockedUntil = now + 60000;
                    showMessage("Too many failed attempts. Try again in 1 minute.");
                } else {
                    showMessage(`Incorrect security question or answer. Attempts left: ${5 - attempts}`);
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
                verificationFields.style.display = "none";
                passwordFields.style.display = "block";
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
                showMessage("Password must contain at least one lowercase letter, one uppercase letter, one number, and be at least 8 characters long.");
                return;
            }

            const studentData = JSON.parse(localStorage.getItem(currentUsername));
            if (!studentData) {
                showMessage("Account not found. Please start over.");
                closeModals();
                return;
            }

            studentData.password = newPassword;
            localStorage.setItem(currentUsername, JSON.stringify(studentData));
            showMessage("Password reset successful.", true);
            closeModals();
        }
    }

    // Event Listeners
    if (signUpForm) {
        signUpForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const lastName = document.getElementById('last-name').value.trim();
            const firstName = document.getElementById('first-name').value.trim();
            const middleName = document.getElementById('middle-name').value.trim();
            const gradeSection = document.getElementById('grade-section').value.trim();
            const email = document.getElementById('email').value.trim();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const idFileInput = document.getElementById('student-id');
            const securityQuestion = document.getElementById('security-question').value.trim();
            const securityAnswer = document.getElementById('security-answer').value.trim();

            if (!lastName || !firstName || !username || !password || !confirmPassword || !securityQuestion || !securityAnswer) {
                showMessage("Please fill in all required fields, including security question and answer.");
                return;
            }

            if (password !== confirmPassword) {
                showMessage("Passwords do not match!");
                return;
            }

            if (!isValidPassword(password)) {
                showMessage("Password must contain at least one lowercase letter, one uppercase letter, one number, and be at least 8 characters long.");
                return;
            }

            if (localStorage.getItem(username)) {
                showMessage("This username is already taken. Please choose a different one.");
                return;
            }

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const storedData = localStorage.getItem(key);
                try {
                    const userData = JSON.parse(storedData);
                    if (userData && typeof userData === 'object' && userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
                        showMessage("This email is already registered. Please use a different email.");
                        return;
                    }
                } catch (e) {
                    console.warn(`Skipping invalid localStorage entry for key "${key}": ${storedData}`);
                    continue;
                }
            }

            const file = idFileInput.files[0];
            if (!file) {
                showMessage("Please upload your student ID.");
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const idImage = e.target.result;
                const studentData = {
                    lastName,
                    firstName,
                    middleName,
                    gradeSection,
                    email,
                    username,
                    password,
                    accepted: false,
                    accountType: 'student',
                    idImage,
                    securityQuestion,
                    securityAnswer
                };
                localStorage.setItem(username, JSON.stringify(studentData));
                showMessage("Account created! Please wait for admin approval.", true);
                signUpForm.reset();
            };
            reader.readAsDataURL(file);
        });
    }

    if (signInForm) {
        signInForm.addEventListener('submit', function (event) {
            event.preventDefault();
            if (isAnyModalOpen()) {
                showMessage("Please close all open modals first.");
                return;
            }

            const username = studentEmailInput.value.trim();
            const password = studentPassInput.value;
            const studentData = JSON.parse(localStorage.getItem(username));
            const now = new Date().getTime();

            if (lockedUntil && now < lockedUntil) {
                const seconds = Math.ceil((lockedUntil - now) / 1000);
                showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
                return;
            }

            if (studentData) {
                if (studentData.password === password) {
                    if (studentData.accepted) {
                        const fullName = getFormattedName(studentData);
                        sessionStorage.setItem("loggedInStudentName", fullName);
                        sessionStorage.setItem("loggedInStudentEmail", studentData.email);
                        showMessage("Login successful!", true);
                        setTimeout(() => {
                            window.location.href = 'student-dashboard.html';
                        }, 2000);
                    } else {
                        showMessage("Your account is not yet accepted by the admin.");
                    }
                } else {
                    showMessage("Incorrect password.");
                    studentPassInput.select();
                    attempts++;
                    if (attempts >= 5) {
                        lockedUntil = now + 60000;
                        showMessage("Too many failed attempts. Try again in 1 minute.");
                    }
                    studentPassInput.value = '';
                }
            } else {
                showMessage("No account found with this username.");
                studentEmailInput.value = '';
                studentPassInput.value = '';
                attempts++;
                if (attempts >= 5) {
                    lockedUntil = now + 60000;
                    showMessage("Too many failed attempts. Try again in 1 minute.");
                }
            }
        });
    }

    if (forgotLink) {
        forgotLink.addEventListener("click", function (e) {
            e.preventDefault();
            if (forgotModal) {
                forgotModal.style.display = "block";
                securityFields.style.display = "block";
                verificationFields.style.display = "none";
                passwordFields.style.display = "none";
                const questionInput = document.getElementById("forgot-question");
                const answerInput = document.getElementById("forgot-answer");
                if (questionInput) questionInput.style.display = "none";
                if (answerInput) answerInput.style.display = "none";
                currentStage = 'initial';
                attempts = 0;
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

            if (lockedUntil && now < lockedUntil) {
                const seconds = Math.ceil((lockedUntil - now) / 1000);
                showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
                return;
            }

            if (!username) {
                showMessage("Please enter your username.");
                return;
            }

            const studentData = JSON.parse(localStorage.getItem(username));
            if (!studentData || studentData.accountType !== "student") {
                showMessage("No student account found with this username.");
                return;
            }

            currentUsername = username;
            currentStage = 'code';
            securityFields.style.display = "none";
            verificationFields.style.display = "block";
            const success = await sendVerificationCode(studentData.email, username);
            if (!success) {
                currentStage = 'initial';
                securityFields.style.display = "block";
                verificationFields.style.display = "none";
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

            const studentData = JSON.parse(localStorage.getItem(username));
            if (!studentData || studentData.accountType !== "student") {
                showMessage("No student account found with this username.");
                return;
            }

            currentUsername = username;
            currentStage = 'security';
            const questionInput = document.getElementById("forgot-question");
            const answerInput = document.getElementById("forgot-answer");
            if (questionInput) questionInput.style.display = "block";
            if (answerInput) answerInput.style.display = "block";
            showMessage("Please enter your security question and answer.", true);
        });
    } else {
        console.error("Security Question button not found");
    }

    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener("click", handleForgotPassword);
    } else {
        console.error("Reset Password button not found");
    }

    if (resendCodeBtn) {
        resendCodeBtn.addEventListener("click", async function () {
            if (currentStage !== 'code') return;
            const studentData = JSON.parse(localStorage.getItem(currentUsername));
            if (!studentData) {
                showMessage("No account found with this username.");
                closeModals();
                return;
            }
            const success = await sendVerificationCode(studentData.email, currentUsername);
            if (success) {
                verificationFields.style.display = "block";
            }
        });
    } else {
        console.error("Resend Code button not found");
    }

    if (closeModal) {
        closeModal.addEventListener("click", closeModals);
    } else {
        console.error("Close Modal button not found");
    }

    if (closeMessageModal) {
        closeMessageModal.addEventListener("click", () => {
            if (messageModal) {
                messageModal.style.display = "none";
                messageModal.classList.remove('success', 'error');
            }
        });
    } else {
        console.error("Close Message Modal button not found");
    }

    window.addEventListener("click", function (event) {
        if (event.target === forgotModal) {
            closeModals();
        } else if (event.target === messageModal) {
            messageModal.style.display = "none";
            messageModal.classList.remove('success', 'error');
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && messageModal && messageModal.style.display === "block") {
            messageModal.style.display = "none";
            messageModal.classList.remove('success', 'error');
        } else if (event.key === "Enter" && forgotModal && forgotModal.style.display === "block") {
            if (resetPasswordBtn) resetPasswordBtn.click();
        }
    });

    document.getElementById("signUp").addEventListener('click', () => {
        document.getElementById('container').classList.add("right-panel-active");
    });

    document.getElementById("signIn").addEventListener('click', () => {
        document.getElementById('container').classList.remove("right-panel-active");
    });

    function getFormattedName(data) {
        return `${capitalize(data.firstName)} ${data.middleName ? capitalize(data.middleName) + ' ' : ''}${capitalize(data.lastName)}`.trim();
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
});

document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const targetId = toggle.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggle.textContent = isPassword ? 'Hide' : 'Show';
    });
});