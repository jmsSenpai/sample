if (!localStorage.getItem("loggedInAdmin")) {
    window.location.href = "admin-login.html";
}

function toggleMenu() {
    let sidebar = document.getElementById("nav-bar");
    sidebar.classList.toggle("collapsed");
}

function loadStudentAccounts() {
    const studentAccountsContainer = document.getElementById('student-accounts');
    studentAccountsContainer.innerHTML = '';

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        let studentData;

        try {
            studentData = JSON.parse(localStorage.getItem(key));
        } catch (error) {
            console.error(`Failed to parse localStorage item for key "${key}":`, error);
            continue;
        }

        if (studentData && typeof studentData === 'object' && studentData.accountType === 'student') {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.setAttribute('data-username', key);

            row.innerHTML = `
                <div class="row-item">${studentData.firstName || 'N/A'} ${studentData.middleName ? studentData.middleName + ' ' : ''}${studentData.lastName || 'N/A'}</div>
                <div class="row-item">${studentData.gradeSection || 'N/A'}</div>
                <div class="row-item">${key}</div>
                <div class="row-item actions">
                    ${studentData.accepted ? '' : `<button class="accept-btn" data-username="${key}">Accept</button>`}
                    ${studentData.accepted ? `<button class="delete-btn" data-username="${key}">Delete</button>` : `<button class="reject-btn" data-username="${key}">Reject</button>`}
                    <button class="details-btn" data-username="${key}">See More Details</button>
                </div>
            `;

            studentAccountsContainer.appendChild(row);
        }
    }

    const acceptButtons = document.querySelectorAll('.accept-btn');
    const rejectButtons = document.querySelectorAll('.reject-btn');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    const detailsButtons = document.querySelectorAll('.details-btn');

    acceptButtons.forEach(button => {
        button.addEventListener('click', async function () {
            const username = this.getAttribute('data-username');
            const studentData = JSON.parse(localStorage.getItem(username));

            if (studentData) {
                try {
                    const response = await fetch('http://localhost:3000/send-acceptance-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            studentEmail: studentData.email,
                            studentName: `${studentData.firstName} ${studentData.lastName}`
                        })
                    });

                    if (response.ok) {
                        studentData.accepted = true;
                        localStorage.setItem(username, JSON.stringify(studentData));
                        Swal.fire('Success!', 'Student accepted and email sent successfully!', 'success');
                        loadStudentAccounts();
                    } else {
                        Swal.fire('Error', 'Failed to send acceptance email. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Error sending acceptance email:', error);
                    Swal.fire('Error', 'Error sending acceptance email. Please try again.', 'error');
                }
            }
        });
    });

    rejectButtons.forEach(button => {
        button.addEventListener('click', async function () {
            const username = this.getAttribute('data-username');
            const studentData = JSON.parse(localStorage.getItem(username));

            if (studentData) {
                try {
                    const response = await fetch('http://localhost:3000/send-rejection-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            studentEmail: studentData.email,
                            studentName: `${studentData.firstName} ${studentData.lastName}`
                        })
                    });

                    if (response.ok) {
                        localStorage.removeItem(username);
                        Swal.fire('Rejected', 'Student account rejected and email sent successfully.', 'success');
                        loadStudentAccounts();
                    } else {
                        Swal.fire('Error', 'Failed to send rejection email. Account not deleted.', 'error');
                    }
                } catch (error) {
                    console.error('Error sending rejection email:', error);
                    Swal.fire('Error', 'Error sending rejection email. Account not deleted.', 'error');
                }
            }
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', function () {
            const username = this.getAttribute('data-username');
            Swal.fire({
                title: 'Are you sure?',
                text: `You are about to delete the student account with username "${username}". This action cannot be undone.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem(username);
                    Swal.fire(
                        'Deleted!',
                        `Student account with username "${username}" has been deleted.`,
                        'success'
                    ).then(() => {
                        loadStudentAccounts();
                    });
                }
            });
        });
    });

    detailsButtons.forEach(button => {
        button.addEventListener('click', function () {
            const username = this.getAttribute('data-username');
            let studentData;

            try {
                studentData = JSON.parse(localStorage.getItem(username));
            } catch (error) {
                console.error(`Failed to parse student data for username "${username}":`, error);
                Swal.fire('Error', 'Error loading student details.', 'error');
                return;
            }

            if (studentData) {
                showModal(studentData);
            } else {
                console

.error(`No student data found for username: ${username}`);
                Swal.fire('Error', 'Student data not found.', 'error');
            }
        });
    });
}

function showModal(studentData) {
    const modal = document.getElementById('student-modal');
    const modalContent = document.getElementById('modal-content');

    if (!modal || !modalContent) {
        console.error('Modal or modal-content element not found');
        Swal.fire('Error', 'Modal element not found.', 'error');
        return;
    }

    document.getElementById('modal-name').textContent = `${studentData.firstName || 'N/A'} ${studentData.middleName ? studentData.middleName + ' ' : ''}${studentData.lastName || 'N/A'}`;
    document.getElementById('modal-email').textContent = studentData.email || 'N/A';
    document.getElementById('modal-grade-section').textContent = studentData.gradeSection || 'N/A';
    document.getElementById('modal-username').textContent = studentData.username || 'N/A';

    const idImageContainer = document.getElementById('modal-id-image');
    if (studentData.idImage) {
        idImageContainer.innerHTML = `<img src="${studentData.idImage}" alt="Student ID" />`;
    } else {
        idImageContainer.innerHTML = '<p>No ID image available</p>';
    }

    modal.style.display = 'flex';
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("Page loaded, initializing...");
    loadStudentAccounts();

    // Update admin name in footer
    const loggedInAdminUsername = localStorage.getItem("loggedInAdmin");
    if (loggedInAdminUsername) {
        let adminData;
        try {
            adminData = JSON.parse(localStorage.getItem(loggedInAdminUsername));
        } catch (error) {
            console.error(`Failed to parse admin data for username "${loggedInAdminUsername}":`, error);
            Swal.fire('Error', 'Failed to load admin data.', 'error');
            return;
        }

        if (adminData && adminData.accountType === 'admin') {
            const fullName = `${adminData.firstName}`;
            const navFooterTitle = document.getElementById("nav-footer-title");
            if (navFooterTitle) {
                navFooterTitle.textContent = fullName;
                navFooterTitle.href = "#";
            }
        }
    }

    // Handle logout with SweetAlert2
    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            Swal.fire({
                title: "Are you sure?",
                text: "Do you want to log out?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, log out",
                cancelButtonText: "Cancel",
               
            }).then((result) => {
                if (result.isConfirmed) {
                    console.log("Logout confirmed, proceeding...");
                    document.body.classList.add("fade-out");
                    setTimeout(function () {
                        localStorage.removeItem("loggedInAdmin");
                        document.querySelectorAll("input").forEach(input => input.value = "");
                        window.location.href = "admin-login.html";
                    }, 1000);
                } else {
                    console.log("Logout cancelled by user.");
                }
            });
        });
    }

    // Modal close on outside click
    const modal = document.getElementById('student-modal');
    if (modal) {
        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Modal close button listener (simplified)
    document.addEventListener('click', function (event) {
        if (event.target.matches('#close-modal, #close-modal-footer')) {
            document.getElementById('student-modal').style.display = 'none';
        }
    });
});