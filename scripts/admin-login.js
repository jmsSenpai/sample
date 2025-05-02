

function isValidPassword(password) {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordPattern.test(password);
}

document.addEventListener("DOMContentLoaded", function () {
    // Show/Hide Password Toggle Logic
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.textContent = 'Hide';
            } else {
                passwordInput.type = 'password';
                this.textContent = 'Show';
            }
        });
    });

    // Existing create account logic
    const createButton = document.querySelector('.create-btn');
    if (createButton) {
        createButton.addEventListener('click', function (event) {
            event.preventDefault();
            const lastName = document.getElementById('lastName').value;
            const firstName = document.getElementById('firstName').value;
            const middleName = document.getElementById('middleName').value;
            const username = document.getElementById('gmail').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const securityQuestion = document.getElementById('security-question').value;
            const securityAnswer = document.getElementById('security-answer').value;

            // Check if username already exists in localStorage
            if (localStorage.getItem(username)) {
                showMessage("This username is already taken. Please choose a different username.");
                return;
            }

            // Validate password
            if (!isValidPassword(password)) {
                showMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long.");
                return;
            }

            // Check if passwords match
            if (password !== confirmPassword) {
                showMessage("Passwords do not match!");
                return;
            }

            // Check if security question and answer are provided
            if (!securityQuestion || !securityAnswer) {
                showMessage("Please select a security question and provide an answer.");
                return;
            }

            // Create admin account object
            const adminAccount = {
                lastName,
                firstName,
                middleName,
                username,
                password,
                securityQuestion,
                securityAnswer,
                accountType: 'admin'
            };

            // Save to localStorage
            localStorage.setItem(username, JSON.stringify(adminAccount));
            showMessage("Admin account created successfully!", true);
            document.querySelector('.create-account-form').reset();
        });
    }
    // Existing loadAdminAccounts function
   function loadAdminAccounts() {
        const accountsTable = document.querySelector('.accounts-table');
        if (!accountsTable) {
            console.log('No .accounts-table element found on this page');
            return;
        }

        console.log('Loading admin accounts...');
        accountsTable.innerHTML = `
            <div class="table-header">
                <div class="header-item">Name</div>
                <div class="header-item">Password</div>
                <div class="header-item">Username</div>
                <div class="header-item">Actions</div>
            </div>
        `;

        let accountCount = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key === 'loggedInAdmin') {
                console.log(`Skipping non-account key: ${key}`);
                continue;
            }

            const rawData = localStorage.getItem(key);
            let adminData;
            try {
                adminData = JSON.parse(rawData);
            } catch (e) {
                console.error(`Failed to parse JSON for key "${key}":`, rawData, e);
                continue;
            }

            if (adminData && adminData.accountType === 'admin') {
                accountCount++;
                const row = document.createElement('div');
                row.className = 'table-row';

                const fullName = `${adminData.firstName} ${adminData.middleName ? adminData.middleName + ' ' : ''}${adminData.lastName}`;

                row.innerHTML = `
                    <div class="row-item">${fullName}</div>
                    <div class="row-item">${adminData.password}</div>
                    <div class="row-item">${adminData.username}</div>
                    <div class="row-item actions">
                        <button class="delete-btn">Delete</button>
                    </div>
                `;

                accountsTable.appendChild(row);
            }
        }
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function () {
                const row = this.closest('.table-row');
                const username = row.querySelector('.row-item:nth-child(3)').textContent;

                localStorage.removeItem(username);
                showMessage(`Admin account with username ${username} has been deleted.`, true);
                loadAdminAccounts();
            });
        });
    }

    loadAdminAccounts();

    // Sign-In Logic
    const signInForm = document.getElementById("signInForm");
    const adminEmailInput = document.getElementById("admin-email");
    const adminPassInput = document.getElementById("admin-pass");
    const messageModal = document.getElementById("messageModal");
    const messageText = document.getElementById("messageText");
    const closeMessageModal = document.getElementById("closeMessageModal");

    let signInAttempts = 0;
    let signInLockedUntil = null;

    function closeModals() {
        if (forgotModal) forgotModal.style.display = "none";
        if (messageModal) {
            messageModal.style.display = "none";
            messageModal.classList.remove('success', 'error');
        }
        if (passwordFields) passwordFields.style.display = "none";
        isSecurityVerified = false;
        if (document.getElementById("forgot-email")) document.getElementById("forgot-email").value = "";
        if (document.getElementById("forgot-question")) document.getElementById("forgot-question").value = "";
        if (document.getElementById("forgot-answer")) document.getElementById("forgot-answer").value = "";
        if (document.getElementById("new-password")) document.getElementById("new-password").value = "";
        if (document.getElementById("reset-confirm-password")) document.getElementById("reset-confirm-password").value = "";
    }

    function isAnyModalOpen() {
        return (forgotModal && forgotModal.style.display === "block") || (messageModal && messageModal.style.display === "block");
    }

    function showMessage(message, autoClose = false) {
        if (messageText && messageModal) {
            messageText.innerText = message;
            const successKeywords = ["successful", "created", "verified", "deleted"];
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
    }

    if (signInForm) {
        signInForm.addEventListener("submit", function (event) {
            event.preventDefault();
            if (isAnyModalOpen()) {
                showMessage("Please close all open modals first.");
                return;
            }

            const username = adminEmailInput.value.trim();
            const password = adminPassInput.value;
            const adminData = JSON.parse(localStorage.getItem(username));
            const now = new Date().getTime();

            if (signInLockedUntil && now < signInLockedUntil) {
                const seconds = Math.ceil((signInLockedUntil - now) / 1000);
                showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
                return;
            }

            if (adminData) {
                if (adminData.password === password) {
                    localStorage.setItem("loggedInAdmin", username);
                    showMessage("Login successful!", true);
                    setTimeout(function () {
                        window.location.href = "admin-dashboard.html";
                    }, 2000);
                } else {
                    showMessage("Incorrect password.");
                    adminPassInput.select();
                    signInAttempts++;
                    if (signInAttempts >= 5) {
                        signInLockedUntil = now + 60000;
                        showMessage("Too many failed attempts. Try again in 1 minute.");
                    }
                    adminPassInput.value = '';
                }
            } else {
                showMessage("No account found with this username.");
                adminEmailInput.value = '';
                adminPassInput.value = '';
                signInAttempts++;
                if (signInAttempts >= 5) {
                    signInLockedUntil = now + 60000;
                    showMessage("Too many failed attempts. Try again in 1 minute.");
                }
            }
        });
    }

    // Forgot Password Logic
    const forgotLink = document.getElementById("forgotLink");
    const forgotModal = document.getElementById("forgotModal");
    const closeModalBtn = document.getElementById("closeModal");
    const resetPasswordBtn = document.getElementById("resetPassword");
    const passwordFields = document.getElementById("password-fields");

    let forgotAttempts = 0;
    let forgotLockedUntil = null;
    let isSecurityVerified = false;

    if (forgotLink) {
        forgotLink.addEventListener("click", function (e) {
            e.preventDefault();
            if (forgotModal) {
                forgotModal.style.display = "block";
                if (passwordFields) passwordFields.style.display = "none";
                isSecurityVerified = false;
                forgotAttempts = 0;
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeModals);
    }

    if (closeMessageModal) {
        closeMessageModal.addEventListener("click", () => {
            if (messageModal) {
                messageModal.style.display = "none";
                messageModal.classList.remove('success', 'error');
            }
        });
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
            closeModals();
        }
    });

    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener("click", function () {
            const username = document.getElementById("forgot-email").value.trim();
            const question = document.getElementById("forgot-question").value.trim();
            const answer = document.getElementById("forgot-answer").value.trim();
            const newPassword = document.getElementById("new-password").value.trim();
            const confirmPassword = document.getElementById("reset-confirm-password").value.trim();
            const now = new Date().getTime();

            if (forgotLockedUntil && now < forgotLockedUntil) {
                const seconds = Math.ceil((forgotLockedUntil - now) / 1000);
                showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
                return;
            }

            if (!isSecurityVerified) {
                if (!username || !question || !answer) {
                    showMessage("Please fill in the required fields.");
                    return;
                }

                const adminData = JSON.parse(localStorage.getItem(username));
                if (!adminData) {
                    showMessage("No account found with this username.");
                    return;
                }

                if (adminData.securityQuestion === question && adminData.securityAnswer === answer) {
                    isSecurityVerified = true;
                    if (passwordFields) passwordFields.style.display = "block";
                    showMessage("Security question verified. Please enter your new password.", true);
                    if (forgotModal) forgotModal.style.display = "block";
                } else {
                    forgotAttempts++;
                    if (forgotAttempts >= 5) {
                        forgotLockedUntil = now + 60000;
                        showMessage("Too many failed attempts. Try again in 1 minute.");
                    } else {
                        showMessage(`Incorrect security answer. Attempts left: ${5 - forgotAttempts}`);
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
                    showMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long.");
                    return;
                }

                const adminData = JSON.parse(localStorage.getItem(username));
                adminData.password = newPassword;
                localStorage.setItem(username, JSON.stringify(adminData));
                showMessage("Password reset successful.", true);
                closeModals();
            }
        });
    }
});
