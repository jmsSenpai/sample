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
    const messageModal = document.getElementById("messageModal");
    const messageText = document.getElementById("messageText");
    const closeMessageModal = document.getElementById("closeMessageModal");

    const studentEmailInput = document.getElementById('student-email');
    const studentPassInput = document.getElementById('student-pass');

    let attempts = 0;
    let lockedUntil = null;
    let isSecurityVerified = false;

    function closeModals() {
        forgotModal.style.display = "none";
        messageModal.style.display = "none";
        messageModal.classList.remove('success', 'error');
        passwordFields.style.display = "none";
        isSecurityVerified = false;
        document.getElementById("forgot-email").value = "";
        document.getElementById("forgot-question").value = "";
        document.getElementById("forgot-answer").value = "";
        document.getElementById("new-password").value = "";
        document.getElementById("reset-confirm-password").value = "";
    }

    function isAnyModalOpen() {
        return forgotModal.style.display === "block" || messageModal.style.display === "block";
    }

    document.getElementById("signUp").addEventListener('click', () => {
        document.getElementById('container').classList.add("right-panel-active");
    });

    document.getElementById("signIn").addEventListener('click', () => {
        document.getElementById('container').classList.remove("right-panel-active");
    });

    forgotLink.addEventListener("click", function (e) {
        e.preventDefault();
        forgotModal.style.display = "block";
        passwordFields.style.display = "none";
        isSecurityVerified = false;
        attempts = 0;
    });

    closeModal.addEventListener("click", closeModals);
    closeMessageModal.addEventListener("click", () => {
        messageModal.style.display = "none";
        messageModal.classList.remove('success', 'error');
    });

    window.addEventListener("click", function (event) {
        if (event.target === forgotModal) {
            closeModals();
        } else if (event.target === messageModal) {
            messageModal.style.display = "none";
            messageModal.classList.remove('success', 'error');
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && messageModal.style.display === "block") {
            messageModal.style.display = "none";
            messageModal.classList.remove('success', 'error');
        } else if (event.key === "Enter" && forgotModal.style.display === "block") {
            closeModals();
        }
    });

    function showMessage(message, autoClose = false) {
        messageText.innerText = message;
        const successKeywords = ["successful", "created", "verified"];
        const isSuccess = successKeywords.some(keyword => message.toLowerCase().includes(keyword));
        messageModal.classList.remove('success', 'error');
        messageModal.classList.add(isSuccess ? 'success' : 'error');
        messageModal.style.display = "block";

        if (autoClose) {
            setTimeout(function () {
                messageModal.style.display = "none";
                messageModal.classList.remove('success', 'error');
            }, 2000);
        }
    }

    resetPasswordBtn.addEventListener("click", function () {
        const username = document.getElementById("forgot-email").value.trim();
        const question = document.getElementById("forgot-question").value.trim();
        const answer = document.getElementById("forgot-answer").value.trim();
        const newPassword = document.getElementById("new-password").value.trim();
        const confirmPassword = document.getElementById("reset-confirm-password").value.trim();
        const now = new Date().getTime();

        if (lockedUntil && now < lockedUntil) {
            const seconds = Math.ceil((lockedUntil - now) / 1000);
            showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
            return;
        }

        if (!isSecurityVerified) {
            if (!username || !question || !answer) {
                showMessage("Please fill in the required fields.");
                return;
            }

            const studentData = JSON.parse(localStorage.getItem(username));

            if (!studentData) {
                showMessage("No account found with this username.");
                return;
            }

            if (studentData.securityQuestion === question && studentData.securityAnswer === answer) {
                isSecurityVerified = true;
                passwordFields.style.display = "block";
                showMessage("Security question verified. Please enter your new password.", true);
                forgotModal.style.display = "block";
            } else {
                attempts++;
                if (attempts >= 5) {
                    lockedUntil = now + 60000;
                    showMessage("Too many failed attempts. Try again in 1 minute.");
                } else {
                    showMessage(`Incorrect security answer. Attempts left: ${5 - attempts}`);
                }
            }
        } else {
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

            const studentData = JSON.parse(localStorage.getItem(username));
            studentData.password = newPassword;
            localStorage.setItem(username, JSON.stringify(studentData));
            showMessage("Password reset successful.", true);
            closeModals();
        }
    });

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
        const securityQuestion = document.getElementById('security-question').value;
        const securityAnswer = document.getElementById('security-answer').value.trim();

        if (!lastName || !firstName || !username || !password || !confirmPassword || !securityAnswer) {
            showMessage("Please fill in all required fields.");
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
            showMessage("Account created! Please wait for admin approval.");
            signUpForm.reset();
        };
        reader.readAsDataURL(file);
    });

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
                    setTimeout(function () {
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

    function getFormattedName(data) {
        return `${capitalize(data.firstName)} ${data.middleName ? capitalize(data.middleName) + ' ' : ''}${capitalize(data.lastName)}`.trim();
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
});