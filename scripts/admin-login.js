document.addEventListener("DOMContentLoaded", function () {
 
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

            const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
            if (!passwordPattern.test(password)) {
                alert("Password must contain at least one uppercase letter, one lowercase letter, and one number.");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            if (!securityQuestion || !securityAnswer) {
                alert("Please select a security question and provide an answer.");
                return;
            }

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

            localStorage.setItem(username, JSON.stringify(adminAccount));
            alert("Admin account created successfully!");
            document.querySelector('.create-account-form').reset();
        });
    }

 
    loadAdminAccounts();

    function loadAdminAccounts() {
        const accountsTable = document.querySelector('.accounts-table');

        if (!accountsTable) return;

        accountsTable.innerHTML = `
            <div class="table-header">
                <div class="header-item">Name</div>
                <div class="header-item">Password</div>
                <div class="header-item">Username</div>
                <div class="header-item">Actions</div>
            </div>
        `;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const adminData = JSON.parse(localStorage.getItem(key));

            if (adminData && adminData.accountType === 'admin') {
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
                alert(`Admin account with username ${username} has been deleted.`);
                loadAdminAccounts();
            });
        });
    }
});




document.addEventListener("DOMContentLoaded", function () {

    const signInForm = document.getElementById("signInForm");

    if (signInForm) {
        signInForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const username = document.getElementById("admin-email").value;
            const password = document.getElementById("admin-pass").value;

            const adminData = JSON.parse(localStorage.getItem(username));

            if (adminData) {
                if (adminData.password === password) {
                    alert("Login successful!");
                    window.location.href = "admin-dashboard.html";
                } else {
                    alert("Incorrect password.");
                }
            } else {
                alert("No account found with that username.");
            }
        });
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;


    const forgotLink = document.getElementById("forgotLink");
    const forgotModal = document.getElementById("forgotModal");
    const closeModalBtn = document.getElementById("closeModal");
    const resetPasswordBtn = document.getElementById("resetPassword");

    let attempts = 0;
    let lockoutTime = 0;

    if (forgotLink) {
        forgotLink.addEventListener("click", function (e) {
            e.preventDefault();
            forgotModal.style.display = "block";
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", function () {
            forgotModal.style.display = "none";
        });
    }

    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener("click", function () {
            const email = document.getElementById("forgot-email").value;
            const question = document.getElementById("forgot-question").value;
            const answer = document.getElementById("forgot-answer").value;

            const adminData = JSON.parse(localStorage.getItem(email));

            if (!adminData) {
                alert("No account found with that username.");
                return;
            }

            if (attempts >= 5) {
                if (lockoutTime > Date.now()) {
                    alert("Too many incorrect attempts. Please try again later.");
                    return;
                } else {
                    attempts = 0; 
                }
            }

            if (adminData.securityQuestion === question && adminData.securityAnswer === answer) {
               
                document.getElementById("password-fields").style.display = "block";

                const newPassword = document.getElementById("new-password").value;
                const confirmPassword = document.getElementById("reset-confirm-password").value;

                if (!newPassword || !confirmPassword) {
                    alert("Please enter and confirm your new password.");
                    return;
                }

                if (!passwordPattern.test(newPassword)) {
                    alert("Password must contain at least one uppercase letter, one lowercase letter, and one number.");
                    return;
                }

                if (newPassword !== confirmPassword) {
                    alert("Passwords do not match.");
                    return;
                }

               
                adminData.password = newPassword;
                localStorage.setItem(email, JSON.stringify(adminData));
                alert("Password reset successfully!");
                forgotModal.style.display = "none";
            } else {
                attempts++;
                if (attempts >= 5) {
                    lockoutTime = Date.now() + 60000; 
                    alert("Too many incorrect attempts. Try again in 1 minute.");
                } else {
                    alert("Incorrect security answer.");
                }
            }
        });
    }
});
