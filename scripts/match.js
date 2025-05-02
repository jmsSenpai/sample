//AuthenticationCheck
if (!localStorage.getItem("loggedInAdmin")) {
    window.location.href = "admin-login.html";
}


const lostItemlists = JSON.parse(localStorage.getItem('lostItems')) || [];
const foundItemlists = JSON.parse(localStorage.getItem('foundItems')) || [];

match(lostItemlists, foundItemlists);
displayMatchedItems();

function displayMatchedItems() {
    const matchedItems = JSON.parse(localStorage.getItem('matchedItems')) || [];
    const lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
    const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
    
    const matchedListDiv = document.getElementById("matched-list");
    matchedListDiv.innerHTML = "";

    if (matchedItems.length === 0) {
        matchedListDiv.innerHTML = "<p>No matched items yet.</p>";
        return;
    }

    matchedItems.forEach(match => {
        const lost = lostItems.find(item => item.idLost === match.lostID);
        const found = foundItems.find(item => item.idFound === match.foundID);

    
        if (!lost || !found) return;

        const itemDiv = document.createElement("div");
        itemDiv.classList.add("matched-item");
        itemDiv.innerHTML = `
            <div class="item-section">
                <img src="${lost.image || 'images/default-image.png'}" alt="Lost Image" onclick="previewImage('${lost.image || 'images/default-image.png'}')">
                <div class="item-label">Lost Image</div>
            </div>
            <div class="item-info">
                <strong>Match Score:</strong> ${match.totalPoints}/100<br>
                <strong>Lost:</strong> ${lost.itemName} - ${lost.description || "No description"}<br>
                <strong>Found:</strong> ${found.itemName} - ${found.description || "No description"}<br>
                <button class="view-button" onclick="openModal(${match.lostID}, ${match.foundID})">View Match</button>
                <button class="match-button" data-lostid="${lost.idLost}">Send Match Email</button>
            </div>
            <div class="item-section">
                <img src="${found.image || 'images/default-image.png'}" alt="Found Image" onclick="previewImage('${found.image || 'images/default-image.png'}')">
                <div class="item-label">Found Image</div>
            </div>
        `;
        matchedListDiv.appendChild(itemDiv);
    });

    const matchButtons = document.querySelectorAll('.match-button');
    matchButtons.forEach(button => {
        button.addEventListener('click', function () {
            const lostID = this.getAttribute('data-lostid');
            const lostItem = lostItems.find(item => item.idLost === Number(lostID));

            if (lostItem && lostItem.ownerEmail) {
                fetch('http://localhost:3000/send-matched-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        studentEmail: lostItem.ownerEmail,
                        studentName: lostItem.name || "Student",
                        itemName: lostItem.itemName
                    })
                })
                    .then(response => response.text())
                    .then(data => {
                        alert('Match email sent successfully!');
                        console.log('Email response:', data);
                    })
                    .catch(error => {
                        console.error('Email error:', error);
                        alert('Failed to send match email.');
                    });
            } else {
                alert("Email for the lost item is not available.");
            }
        });
    });
}

function openModal(lostID, foundID) {
    const lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
    const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
    const lost = lostItems.find(item => item.idLost === lostID);
    const found = foundItems.find(item => item.idFound === foundID);

    if (!lost || !found) {
        alert("Cannot display match details: Item data not found.");
        return;
    }

    const modalDetails = document.getElementById("modalDetails");
    modalDetails.innerHTML = `
        <h3>Match Details</h3>
        <div class="modal-images">
            <div>
                <img src="${lost.image || 'images/default-image.png'}" alt="Lost Item" onclick="previewImage('${lost.image || 'images/default-image.png'}')">
                <p>Lost Image</p>
            </div>
            <div>
                <img src="${found.image || 'images/default-image.png'}" alt="Found Item" onclick="previewImage('${found.image || 'images/default-image.png'}')">
                <p>Found Image</p>
            </div>
        </div>
        <div class="modal-details">
            <p><strong>Lost Item:</strong> ${lost.itemName}</p>
            <p><strong>Description:</strong> ${lost.description || "No description"}</p>
            <p><strong>Category:</strong> ${lost.category || "N/A"}</p>
            <p><strong>Color:</strong> <span style="color:${lost.itemColor}">${lost.itemColor || "N/A"}</span></p>
            <p><strong>Last Seen At:</strong> ${lost.lastLocated || "N/A"}</p>
            <p><strong>Date Lost:</strong> ${lost.dateLost || "N/A"}</p>
            <hr>
            <p><strong>Found Item:</strong> ${found.itemName}</p>
            <p><strong>Description:</strong> ${found.description || "No description"}</p>
            <p><strong>Category:</strong> ${found.category || "N/A"}</p>
            <p><strong>Color:</strong> <span style="color:${found.itemColor}">${found.itemColor || "N/A"}</span></p>
            <p><strong>Found At:</strong> ${found.foundAt || "N/A"}</p>
            <p><strong>Date Found:</strong> ${found.dateFound || "N/A"}</p>
        </div>
    `;
    document.getElementById("matchModal").style.display = "block";
}

function closeModal() {
    document.getElementById("matchModal").style.display = "none";
}

function previewImage(src) {
    const modal = document.getElementById("imageModal");
    const img = document.getElementById("previewImg");
    img.src = src;
    modal.style.display = "block";
}

function closeImageModal() {
    document.getElementById("imageModal").style.display = "none";
}

function match(lostItemlist, foundItemlist) {
    for (let i = 0; i < lostItemlist.length; i++) {
        for (let index = 0; index < foundItemlist.length; index++) {
            let lostID = lostItemlist[i].idLost;
            let foundID = foundItemlist[index].idFound;
            let itemLost = lostItemlist[i].itemName.toLowerCase();
            let itemLostArray = itemLost.split(" ");
            let itemFound = foundItemlist[index].itemName.toLowerCase();
            let itemFoundArray = itemFound.split(" ");
            let itemLostLocation = lostItemlist[i].lastLocated.toLowerCase();
            let itemFoundLocation = foundItemlist[index].foundAt.toLowerCase();
            let itemLostLocationArray = itemLostLocation.split(" ");
            let itemFoundLocationArray = itemFoundLocation.split(" ");
            let itemLostCategory = lostItemlist[i].category;
            let itemFoundCategory = foundItemlist[index].category;
            const itemLostDate = new Date(lostItemlist[i].dateLost);
            const itemFoundDate = new Date(lostItemlist[index].dateFound);
            let itemLostColor = lostItemlist[i].itemColor;
            let itemFoundColor = foundItemlist[index].itemColor;

            let pointsItemName = points(itemLost, itemFound, itemLostArray, itemFoundArray);
            let pointsItemCategory = points(itemLostCategory, itemFoundCategory, null, null);
            let pointsLocation = points(itemLostLocation, itemFoundLocation, itemLostLocationArray, itemFoundLocationArray);
            let pointsItemDate = pointsDate(itemLostDate, itemFoundDate);
            let pointsItemColor = pointsColor(itemLostColor, itemFoundColor);

            let totalPoints = pointsItemName + pointsItemCategory + pointsLocation + pointsItemDate + pointsItemColor;

            let localStorageMatch = JSON.parse(localStorage.getItem('matchedItems')) || [];

            let alreadyExists = localStorageMatch.some(m => m.lostID === lostID && m.foundID === foundID);
            if (alreadyExists) totalPoints = 0;

         
            if (totalPoints >= 70) {
                const matched = { 
                    lostID, 
                    foundID, 
                    totalPoints, 
                    itemLost, 
                    itemFound, 
                    itemLostLocation, 
                    itemFoundLocation, 
                    itemLostDate, 
                    itemFoundDate 
                };
                
                localStorageMatch.push(matched);
                localStorage.setItem('matchedItems', JSON.stringify(localStorageMatch));

                displayMatchedItems();
            }
        }
    }
}

function pointsDate(lostDate, foundDate) {
    if (lostDate.toDateString() === foundDate.toDateString()) return 20;
    const diff = Math.abs(lostDate - foundDate);
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 20;
    if (diffDays <= 7) return 10;
    return 0;
}

function points(lost, found, lostArray, foundArray) {
    if (lost === found) return 20;
    if (foundArray && lostArray) {
        let totalLength = foundArray.length + lostArray.length;
        let matched = 0;
        for (let i = 0; i < lostArray.length; i++) {
            for (let j = 0; j < foundArray.length; j++) {
                if (lostArray[i] === foundArray[j]) matched += 2;
            }
        }
        let percent = matched / totalLength;
        return percent * 20;
    }
    return 0;
}

function hexToRGB(hex) {
    hex = hex.replace("#", "");
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
}

function pointsColor(lostColor, foundColor) {
    let lostRGB = hexToRGB(lostColor);
    let foundRGB = hexToRGB(foundColor);
    let diffColor = Math.sqrt(
        Math.pow(lostRGB.r - foundRGB.r, 2) +
        Math.pow(lostRGB.g - foundRGB.g, 2) +
        Math.pow(lostRGB.b - foundRGB.b, 2)
    );
    if (diffColor <= 50) return 20;
    if (diffColor <= 100) return 10;
    return 0;
}


document.addEventListener("DOMContentLoaded", function () {
   
    const loggedInAdminUsername = localStorage.getItem("loggedInAdmin");


    if (loggedInAdminUsername) {
        const adminData = JSON.parse(localStorage.getItem(loggedInAdminUsername));
        if (adminData && adminData.accountType === 'admin') {
          
            const fullName = `${adminData.firstName}`;
    
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