document.addEventListener("DOMContentLoaded", function () {
    const fullName = sessionStorage.getItem("loggedInStudentName");
    const nameInput = document.getElementById("name");

    // Redirect to login if not authenticated
    if (!fullName) {
        Swal.fire({
            title: 'Unauthorized Access',
            text: 'Please log in to report a found item.',
            icon: 'warning',
            confirmButtonText: 'OK',
            customClass: {
                popup: 'swal-error'
            }
        }).then(() => {
            window.location.href = "student-login.html";
        });
        return;
    }

    // Populate the name input field
    if (fullName && nameInput) {
        nameInput.value = fullName;
    }

    // Update footer with user name
    if (fullName) {
        const title = document.getElementById("nav-footer-title");
        const subtitle = document.getElementById("nav-footer-subtitle");
        title.textContent = fullName;
        subtitle.textContent = "Student";
    }

    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
            event.preventDefault();
            console.log("Logout button clicked!");
            Swal.fire({
                title: 'Are you sure?',
                text: 'Do you want to log out?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, log out',
                cancelButtonText: 'Cancel',
                customClass: {
                    popup: 'swal-confirm'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    document.body.classList.add("fade-out");
                    setTimeout(function () {
                        localStorage.removeItem("loggedInAdmin");
                        sessionStorage.removeItem("loggedInStudentName");
                        const inputs = document.querySelectorAll("input");
                        inputs.forEach(input => input.value = "");
                        window.location.href = "student-login.html";
                    }, 1000);
                }
            });
        });
    }
});

function showModal() {
    Swal.fire({
        title: 'Item Successfully Submitted',
        text: 'Please go to the Registrar\'s office to submit the item that you found.',
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: {
            popup: 'swal-success'
        }
    });
}

function submitForm(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const category = document.getElementById('category').value;
    const itemName = document.getElementById('itemName').value;
    const foundAt = document.getElementById('foundAt').value;
    const dateFound = document.getElementById('dateFound').value;
    // Capture current time
    const now = new Date();
    const timeReported = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g., "02:30 PM"
    const itemColor = document.getElementById('itemColor').value;
    const description = document.getElementById('description').value;
    const imageFile = document.getElementById('itemImage').files[0];
    const reportedBy = sessionStorage.getItem("loggedInStudentName");

    // Image upload validation
    if (imageFile) {
        // Allowed file types
        const allowedTypes = ['image/jpeg', 'image/png'];
        // Max file size (5MB in bytes)
        const maxSize = 5 * 1024 * 1024; // 5MB

        // Check file type
        if (!allowedTypes.includes(imageFile.type)) {
            Swal.fire({
                title: 'Invalid File Type',
                text: 'Please upload an image in JPEG or PNG format.',
                icon: 'error',
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'swal-error'
                }
            });
            return;
        }

        // Check file size
        if (imageFile.size > maxSize) {
            Swal.fire({
                title: 'File Too Large',
                text: 'The image size must not exceed 5MB.',
                icon: 'error',
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'swal-error'
                }
            });
            return;
        }
    }

    const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
    const idFound = idGenerator(foundItems);

    const foundItem = {
        name,
        category,
        itemName,
        foundAt,
        dateFound,
        timeReported,
        itemColor,
        description,
        image: null,
        idFound,
        reportedBy,
        status: "Pending"
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            foundItem.image = event.target.result;
            foundItems.push(foundItem);
            localStorage.setItem('foundItems', JSON.stringify(foundItems));
            document.getElementById('found-item-form').reset();
            document.getElementById('name').value = sessionStorage.getItem("loggedInStudentName");
            showModal();
        };
        reader.readAsDataURL(imageFile);
    } else {
        foundItems.push(foundItem);
        localStorage.setItem('foundItems', JSON.stringify(foundItems));
        document.getElementById('found-item-form').reset();
        document.getElementById('name').value = sessionStorage.getItem("loggedInStudentName");
        showModal();
    }
}

function idGenerator(foundItems) {
    let id = Math.random() * 100000;
    for (let i = 0; i < foundItems.length; i++) {
        if (foundItems[i].idFound === id) {
            id = Math.random() * 100000;
            i = 0;
        }
    }
    return id;
}