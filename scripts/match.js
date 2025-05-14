// Authentication Check
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

    const visibleMatchedItems = matchedItems.filter(match => match.isVisible !== false);

    if (visibleMatchedItems.length === 0) {
        matchedListDiv.innerHTML = "<p>No matched items yet.</p>";
        return;
    }

    visibleMatchedItems.forEach((match, index) => {
        const lost = lostItems.find(item => item.idLost === match.lostID);
        const found = foundItems.find(item => item.idFound === match.foundID);

        if (!lost || !found) {
            console.warn(`Match at index ${index} skipped: Lost item (ID: ${match.lostID}) or Found item (ID: ${match.foundID}) not found.`);
            return;
        }

        const itemDiv = document.createElement("div");
        itemDiv.classList.add("matched-item");
        itemDiv.innerHTML = `
            <div class="item-section">
                <img src="${lost.image || 'images/default-image.png'}" alt="Lost Image" onclick="previewImage('${lost.image || 'images/default-image.png'}')">
                <div class="item-label">Lost Image</div>
            </div>
            <div class="item-info">
                <strong>Match Score:</strong> ${match.manual ? 'Custom' : `${match.totalPoints}/100`}<br>
                <strong>Lost:</strong> ${lost.itemName} - ${lost.description || "No description"} (Reported: ${lost.timeReported || 'N/A'})<br>
                <strong>Found:</strong> ${found.itemName} - ${found.description || "No description"} (Reported: ${found.timeReported || 'N/A'})<br>
                <button class="view-button" onclick="openModal(${match.lostID}, ${match.foundID})">View Match</button>
                <button class="match-button ${match.emailSent ? 'disabled-button' : ''}" data-lostid="${lost.idLost}" data-foundid="${found.idFound}">${match.emailSent ? 'Claimed' : 'Send Match Email'}</button>
            </div>
            <div class="item-section">
                <img src="${found.image || 'images/default-image.png'}" alt="Found Image" onclick="previewImage('${found.image || 'images/default-image.png'}')">
                <div class="item-label">Found Image</div>
            </div>
        `;
        matchedListDiv.appendChild(itemDiv);
    });

    // Re-attach event listeners to match buttons
    const matchButtons = document.querySelectorAll('.match-button');
    matchButtons.forEach(button => {
        button.addEventListener('click', function () {
            const lostID = Number(this.getAttribute('data-lostid'));
            const foundID = Number(this.getAttribute('data-foundid'));
            const isClaimed = this.classList.contains('disabled-button');
            console.log(`Match button clicked: lostID=${lostID}, foundID=${foundID}, isClaimed=${isClaimed}`);

            if (isClaimed) {
                // Prompt for claim confirmation
                Swal.fire({
                    title: 'Confirm Claim',
                    text: 'Is this item claimed by the student?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, item is claimed',
                    cancelButtonText: 'No'
                }).then((result) => {
                    if (result.isConfirmed) {
                        console.log(`Confirming claim for lostID=${lostID}, foundID=${foundID}`);
                        confirmClaim(lostID, foundID);
                    } else {
                        console.log('Claim confirmation cancelled');
                    }
                });
                return;
            }

            const lostItem = lostItems.find(item => item.idLost === lostID);
            const foundItem = foundItems.find(item => item.idFound === foundID);

            if (lostItem && lostItem.ownerEmail && foundItem) {
                console.log(`Sending email for lostID=${lostID}, email=${lostItem.ownerEmail}`);
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
                    .then(response => {
                        if (!response.ok) throw new Error('Email send failed');
                        return response.text();
                    })
                    .then(data => {
                        // Update matchedItems to mark email as sent
                        const matchedItems = JSON.parse(localStorage.getItem('matchedItems')) || [];
                        const matchIndex = matchedItems.findIndex(m => m.lostID === lostID && m.foundID === foundID);
                        if (matchIndex !== -1) {
                            matchedItems[matchIndex].emailSent = true;
                            localStorage.setItem('matchedItems', JSON.stringify(matchedItems));
                            console.log(`Email sent, updated match at index ${matchIndex}: emailSent=true`);
                        } else {
                            console.warn(`Match not found for lostID=${lostID}, foundID=${foundID}`);
                        }

                        // Update status of lost and found items to "Matched"
                        const lostIndex = lostItems.findIndex(item => item.idLost === lostID);
                        const foundIndex = foundItems.findIndex(item => item.idFound === foundID);
                        
                        if (lostIndex !== -1) {
                            lostItems[lostIndex].status = "Matched";
                        } else {
                            console.warn(`Lost item ${lostID} not found for status update`);
                        }
                        if (foundIndex !== -1) {
                            foundItems[foundIndex].status = "Matched";
                        } else {
                            console.warn(`Found item ${foundID} not found for status update`);
                        }

                        // Save updated items back to localStorage
                        localStorage.setItem('lostItems', JSON.stringify(lostItems));
                        localStorage.setItem('foundItems', JSON.stringify(foundItems));

                        Swal.fire({
                            title: 'Success',
                            text: 'Match email sent successfully and status updated to Matched!',
                            icon: 'success',
                            confirmButtonText: 'OK',
                            customClass: {
                                popup: 'swal-success'
                            }
                        }).then(() => {
                            console.log('Refreshing matched items display after email send');
                            displayMatchedItems();
                        });
                    })
                    .catch(error => {
                        console.error('Email error:', error);
                        Swal.fire({
                            title: 'Error',
                            text: 'Failed to send match email.',
                            icon: 'error',
                            confirmButtonText: 'OK',
                            customClass: {
                                popup: 'swal-error'
                            }
                        });
                    });
            } else {
                console.warn(`Cannot send email: lostItem=${!!lostItem}, ownerEmail=${lostItem?.ownerEmail}, foundItem=${!!foundItem}`);
                Swal.fire({
                    title: 'Error',
                    text: 'Email for the lost item or found item data is not available.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    customClass: {
                        popup: 'swal-error'
                    }
                });
            }
        });
    });
}

function confirmClaim(lostID, foundID) {
    console.log(`Executing confirmClaim for lostID=${lostID}, foundID=${foundID}`);
    const matchedItems = JSON.parse(localStorage.getItem('matchedItems')) || [];
    const lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
    const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];

    // Update matched item
    const matchIndex = matchedItems.findIndex(m => m.lostID === lostID && m.foundID === foundID);
    if (matchIndex !== -1) {
        matchedItems[matchIndex].isVisible = false;
        matchedItems[matchIndex].isConfirmed = true;
        localStorage.setItem('matchedItems', JSON.stringify(matchedItems));
        console.log(`Updated matched item at index ${matchIndex}: isVisible=false, isConfirmed=true`);
    } else {
        console.warn(`Match not found for lostID=${lostID}, foundID=${foundID}`);
    }

    // Update lost item
    const lostIndex = lostItems.findIndex(item => item.idLost === lostID);
    if (lostIndex !== -1) {
        lostItems[lostIndex].isVisible = false;
        lostItems[lostIndex].status = "Claimed";
        localStorage.setItem('lostItems', JSON.stringify(lostItems));
        console.log(`Updated lost item at index ${lostIndex}: isVisible=false, status=Claimed`);
    } else {
        console.warn(`Lost item ${lostID} not found`);
    }

    // Update found item
    const foundIndex = foundItems.findIndex(item => item.idFound === foundID);
    if (foundIndex !== -1) {
        foundItems[foundIndex].isVisible = false;
        foundItems[foundIndex].status = "Claimed";
        localStorage.setItem('foundItems', JSON.stringify(foundItems));
        console.log(`Updated found item at index ${foundIndex}: isVisible=false, status=Claimed`);
    } else {
        console.warn(`Found item ${foundID} not found`);
    }

    Swal.fire({
        title: 'Item Claimed',
        text: 'The item has been marked as claimed and removed from Lost, Found, and Matched lists.',
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: {
            popup: 'swal-success'
        }
    }).then(() => {
        console.log('Refreshing matched items display after claim confirmation');
        displayMatchedItems();
    });
}

function openModal(lostID, foundID) {
    const lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
    const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
    const lost = lostItems.find(item => item.idLost === lostID);
    const found = foundItems.find(item => item.idFound === foundID);

    if (!lost || !found) {
        Swal.fire({
            title: 'Error',
            text: 'Cannot display match details: Item data not found.',
            icon: 'error',
            confirmButtonText: 'OK',
            customClass: {
                popup: 'swal-error'
            }
        });
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
            <p><strong>Color:</strong> <div class="color-rectangle" style="background-color: ${lost.itemColor || '#ccc'};"></div></p>
            <p><strong>Last Seen At:</strong> ${lost.lastLocated || "N/A"}</p>
            <p><strong>Date Lost:</strong> ${lost.dateLost || "N/A"}</p>
            <p><strong>Time Reported:</strong> ${lost.timeReported || "N/A"}</p>
            <hr>
            <p><strong>Found Item:</strong> ${found.itemName}</p>
            <p><strong>Description:</strong> ${found.description || "No description"}</p>
            <p><strong>Category:</strong> ${found.category || "N/A"}</p>
            <p><strong>Color:</strong> <div class="color-rectangle" style="background-color: ${found.itemColor || '#ccc'};"></div></p>
            <p><strong>Found At:</strong> ${found.foundAt || "N/A"}</p>
            <p><strong>Date Found:</strong> ${found.dateFound || "N/A"}</p>
            <p><strong>Time Reported:</strong> ${found.timeReported || "N/A"}</p>
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
    if (modal && img) {
        img.src = src;
        modal.style.display = "block";
    } else {
        console.error("Image modal or preview image element not found.");
    }
}

function closeImageModal() {
    const modal = document.getElementById("imageModal");
    if (modal) {
        modal.style.display = "none";
    }
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
            const itemFoundDate = new Date(foundItemlist[index].dateFound);
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
                    itemFoundDate,
                    manual: false,
                    emailSent: false,
                    isConfirmed: false,
                    isVisible: true
                };
                
                localStorageMatch.push(matched);
                localStorage.setItem('matchedItems', JSON.stringify(localStorageMatch));
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
            Swal.fire({
                title: 'Are you sure?',
                text: "Do you want to logout?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, logout!',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    document.body.classList.add("fade-out");
                    setTimeout(function () {
                        localStorage.removeItem("loggedInAdmin");
                        const inputs = document.querySelectorAll("input");
                        inputs.forEach(input => {
                            input.value = "";
                        });
                        window.location.href = "admin-login.html";
                    }, 1000);
                }
            });
        });
    }
});