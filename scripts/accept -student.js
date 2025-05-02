if (!localStorage.getItem("loggedInAdmin")) {
           
    window.location.href = "admin-login.html";
}

function toggleMenu() {
    let sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
}

document.addEventListener("DOMContentLoaded", function () {
    loadStudentAccounts();

    // Handle logout
    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            document.body.classList.add("fade-out");
            setTimeout(function () {
                localStorage.removeItem("loggedInAdmin");
                const inputs = document.querySelectorAll("input");
                inputs.forEach(input => {
                    input.value = "";
                });
                window.location.href = "admin-login.html";
            }, 1000);
        });
    }

    // Update admin name in footer
    const loggedInAdminUsername = localStorage.getItem("loggedInAdmin");
    if (loggedInAdminUsername) {
        const adminData = JSON.parse(localStorage.getItem(loggedInAdminUsername));
        if (adminData && adminData.accountType === 'admin') {
            const fullName = `${adminData.firstName} `;
            const navFooterTitle = document.getElementById("nav-footer-title");
            if (navFooterTitle) {
                navFooterTitle.textContent = fullName;
                navFooterTitle.href = "#";
            }
        }
    }

    // Modal close on outside click
    const modal = document.getElementById('student-modal');
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Modal close button listener
    document.addEventListener('click', function (event) {
        if (event.target.id === 'close-modal') {
            document.getElementById('student-modal').style.display = 'none';
        }
    });
});

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
            continue; // Skip invalid entries
        }

        // Check if studentData is an object and has the expected accountType
        if (studentData && typeof studentData === 'object' && studentData.accountType === 'student') {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.setAttribute('data-username', key);

            row.innerHTML = `
                <div class="row-item">${studentData.firstName || 'N/A'} ${studentData.middleName ? studentData.middleName + ' ' : ''}${studentData.lastName || 'N/A'}</div>
                <div class="row-item">${studentData.gradeSection || 'N/A'}</div>
                <div class="row-item">${key}</div>
                <div class="row-item actions">
                    ${studentData.accepted ? '' : '<button class="accept-btn">Accept</button>'}
                    <button class="delete-btn">Delete</button>
                    <button class="details-btn">See More Details</button>
                </div>
            `;

            studentAccountsContainer.appendChild(row);
        }
    }

    const acceptButtons = document.querySelectorAll('.accept-btn');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    const detailsButtons = document.querySelectorAll('.details-btn');

    acceptButtons.forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('.table-row');
            const username = row.getAttribute('data-username');
            const studentData = JSON.parse(localStorage.getItem(username));

            if (studentData) {
                studentData.accepted = true;
                localStorage.setItem(username, JSON.stringify(studentData));

                fetch('http://localhost:3000/send-acceptance-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        studentEmail: studentData.email,
                        studentName: `${studentData.firstName} ${studentData.lastName}`
                    })
                })
                .then(response => response.text())
                .then(data => {
                    console.log('Email sent successfully:', data);
                    alert('Acceptance email sent!');
                })
                .catch(error => {
                    console.error('Error sending email:', error);
                    alert('Failed to send acceptance email.');
                });

                loadStudentAccounts();
            }
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('.table-row');
            const username = row.getAttribute('data-username');
            localStorage.removeItem(username);
            alert(`Student account with username ${username} has been deleted.`);
            loadStudentAccounts();
        });
    });

    detailsButtons.forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('.table-row');
            const username = row.getAttribute('data-username');
            let studentData;

            try {
                studentData = JSON.parse(localStorage.getItem(username));
            } catch (error) {
                console.error(`Failed to parse student data for username "${username}":`, error);
                alert('Error loading student details.');
                return;
            }

            if (studentData) {
                showModal(studentData);
            } else {
                console.error(`No student data found for username: ${username}`);
                alert('Student data not found.');
            }
        });
    });
}

function showModal(studentData) {
    console.log('Showing modal with data:', studentData);
    const modal = document.getElementById('student-modal');
    const modalContent = document.getElementById('modal-content');

    if (!modal || !modalContent) {
        console.error('Modal or modal-content element not found');
        return;
    }

    // Populate modal fields
    document.getElementById('modal-name').textContent = `${studentData.firstName || 'N/A'} ${studentData.middleName ? studentData.middleName + ' ' : ''}${studentData.lastName || 'N/A'}`;
    document.getElementById('modal-email').textContent = studentData.email || 'N/A';
    document.getElementById('modal-grade-section').textContent = studentData.gradeSection || 'N/A';
    document.getElementById('modal-username').textContent = studentData.username || 'N/A';
    document.getElementById('modal-other-info').textContent = studentData.otherInfo || 'N/A';

    // Handle student ID image
    const idImageContainer = document.getElementById('modal-id-image');
    if (studentData.idImage) {
        idImageContainer.innerHTML = `<img src="${studentData.idImage}" alt="Student ID" />`;
    } else {
        idImageContainer.innerHTML = '<p>No ID image available</p>';
    }

    console.log('Modal content set, displaying modal');
    modal.style.display = 'flex';
}
document.addEventListener("DOMContentLoaded", function () {
    
    const loggedInAdminUsername = localStorage.getItem("loggedInAdmin");


    if (loggedInAdminUsername) {
        const adminData = JSON.parse(localStorage.getItem(loggedInAdminUsername));
        if (adminData && adminData.accountType === 'admin') {
        
            const fullName = `${adminData.firstName} `;
        
            const navFooterTitle = document.getElementById("nav-footer-title");
            if (navFooterTitle) {
                navFooterTitle.textContent = fullName;
            
                navFooterTitle.href = "#"; 
            }
        }
    }

    
    const logoutButton = document.getElementById("logout-btn");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            document.body.classList.add("fade-out");

            setTimeout(function () {
                localStorage.removeItem("loggedInAdmin");

                const inputs = document.querySelectorAll("input");
                inputs.forEach(input => {
                    input.value = "";
                });

                window.location.href = "admin-login.html";
            }, 1000);
        });
    }
});