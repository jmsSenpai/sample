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

    let attempts = 0;
    let lockedUntil = null;

  
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
        document.getElementById("forgot-email").value = "";
        document.getElementById("forgot-answer").value = "";
        document.getElementById("new-password").value = "";
        document.getElementById("confirm-password").value = "";
        attempts = 0;
    });

    closeModal.addEventListener("click", function () {
        forgotModal.style.display = "none";
    });

    window.addEventListener("click", function (event) {
        if (event.target == forgotModal) {
            forgotModal.style.display = "none";
        }
    });

    
    function showMessage(message, autoClose = false) {
        messageText.innerText = message;
        messageModal.style.display = "block";

        if (autoClose) {
            setTimeout(function () {
                messageModal.style.display = "none";
            }, 2000); 
        }
    }

    closeMessageModal.addEventListener("click", function () {
        messageModal.style.display = "none";
    });

    
    resetPasswordBtn.addEventListener("click", function () {
        const username = document.getElementById("forgot-email").value.trim();
        const question = document.getElementById("forgot-question").value.trim();
        const answer = document.getElementById("forgot-answer").value.trim();
        const newPassword = document.getElementById("new-password").value.trim();
        const confirmPassword = document.getElementById("confirm-password").value.trim();

        const studentData = JSON.parse(localStorage.getItem(username)); 
        const now = new Date().getTime();

       
        if (lockedUntil && now < lockedUntil) {
            const seconds = Math.ceil((lockedUntil - now) / 1000);
            showMessage(`Too many attempts. Please try again in ${seconds} second(s).`);
            return;
        }

        if (!studentData) {
            showMessage("No account found with this username.");
            return;
        }

        if (studentData.securityQuestion === question && studentData.securityAnswer === answer) {
            
            passwordFields.style.display = "block";

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

            studentData.password = newPassword;
            localStorage.setItem(username, JSON.stringify(studentData));
            showMessage("Password reset successful.");
            forgotModal.style.display = "none";
            passwordFields.style.display = "none";
            attempts = 0;
        } else {
           
            attempts++;
            if (attempts >= 5) {
                lockedUntil = new Date().getTime() + 60000; 
                showMessage("Too many failed attempts. Try again in 1 minute.");
                passwordFields.style.display = "none";
            } else {
                showMessage(`Incorrect security answer. Attempts left: ${5 - attempts}`);
                passwordFields.style.display = "none";
            }
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

        const username = document.getElementById('student-email').value.trim(); 
        const password = document.getElementById('student-pass').value;

        const studentData = JSON.parse(localStorage.getItem(username)); 

        if (studentData) {
            if (studentData.password === password) {
                if (studentData.accepted) {
                    showMessage("Login successful!", true); 
                    setTimeout(function () {
                        window.location.href = 'student-dashboard.html'; 
                    }, 2000);
                } else {
                    showMessage("Your account is not yet accepted by the admin.");
                }
            } else {
                showMessage("Incorrect password.");
            }
        } else {
            showMessage("No account found with this username.");
        }
    });
});
