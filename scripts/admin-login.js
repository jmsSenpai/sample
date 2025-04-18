function toggleMenu() {
  let sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("collapsed");
}

function openModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}


document.addEventListener("DOMContentLoaded", loadAdminAccounts);

function loadAdminAccounts() {
    const accountsTable = document.querySelector('.accounts-table');

   
    accountsTable.innerHTML = `
        <div class="table-header">
            <div class="header-item">Name</div>
            <div class="header-item">Password</div>
            <div class="header-item">E-mail</div>
            <div class="header-item">Actions</div>
        </div>
    `;

   
    if (localStorage.length === 0) {
        const defaultAccount = {
            firstName: "Default",
            middleName: "Admin",
            lastName: "User ",
            gmail: "defaultadmin@gmail.com",
            password: "defaultPassword"
        };

        localStorage.setItem(defaultAccount.gmail, JSON.stringify(defaultAccount));
    }

  
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const adminData = JSON.parse(localStorage.getItem(key));

       
        if (adminData && adminData.gmail) {
            const row = document.createElement('div');
            row.className = 'table-row';

           
            const fullName = `${adminData.firstName} ${adminData.middleName ? adminData.middleName + ' ' : ''}${adminData.lastName}`;

            row.innerHTML = `
                <div class="row-item">${fullName}</div>
                <div class="row-item">${adminData.password}</div>
                <div class="row-item">${adminData.gmail}</div>
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
            const email = row.querySelector('.row-item:nth-child(3)').textContent; 

            localStorage.removeItem(email); 
            alert(`Admin account with email ${email} has been deleted.`);
            loadAdminAccounts(); 
        });
    });
}


document.addEventListener("DOMContentLoaded", function () {
    const adminForm = document.getElementById('Admin-form');

    adminForm.addEventListener('submit', function (event) {
        event.preventDefault(); 

        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

       
        const adminData = JSON.parse(localStorage.getItem(email));

        if (adminData) {
            if (adminData.password === password) {
                alert("Sign in successful!");
                window.location.href = "Admin-dashboard.html"; 
            } else {
                alert("Incorrect password. Please try again.");
            }
        } else {
            alert("No account found with this email.");
        }
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const createButton = document.querySelector('.create-btn');

    createButton.addEventListener('click', function (event) {
        event.preventDefault();

        const lastName = document.getElementById('lastName').value;
        const firstName = document.getElementById('firstName').value;
        const middleName = document.getElementById('middleName').value;
        const gmail = document.getElementById('gmail').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

 
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }


          const adminAccount = {
            lastName,
            firstName,
            middleName,
            gmail,
            password,
            accountType: 'admin' 
          };

       
        localStorage.setItem(gmail, JSON.stringify(adminAccount));
        alert("Account created successfully!");

        
        document.querySelector('.create-account-form').reset();
        loadAdminAccounts(); 
    });
});