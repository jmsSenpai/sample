document.addEventListener("DOMContentLoaded", function () {
    if (!localStorage.getItem("loggedInAdmin")) {
        Swal.fire({
            title: 'Unauthorized Access',
            text: 'Please log in to view matched items.',
            icon: 'warning',
            confirmButtonText: 'OK',
            customClass: {
                popup: 'swal-error'
            }
        }).then(() => {
            window.location.href = "admin-login.html";
        });
        return;
    }

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

    const lostItemlists = JSON.parse(localStorage.getItem('lostItems')) || [];
    const foundItemlists = JSON.parse(localStorage.getItem('foundItems')) || [];
    match(lostItemlists, foundItemlists);
    displayMatchedItems();
});

function displayMatchedItems() {
    const matchedItems = JSON.parse(localStorage.getItem('matchedItems')) || [];
    const visibleMatchedItems = matchedItems.filter(match => match.isVisible !== false);
    const lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
    const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
    const matchedListDiv = document.getElementById("matched-list");
    matchedListDiv.innerHTML = "";

    if (visibleMatchedItems.length === 0) {
        const noItemsMessage = document.createElement('div');
        noItemsMessage.classList.add('no-items-message');
        noItemsMessage.innerText = 'There are no matched items yet.';
        matchedListDiv.appendChild(noItemsMessage);
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
        const buttonText = match.emailSent ? "Confirm" : "Send Match Email";
        const buttonClass = match.emailSent ? "confirm-button" : "match-button";
        itemDiv.innerHTML = `
            <div class="item-section">
                <img src="${lost.image || 'images/default-image.png'}" alt="Lost Image">
                <div class="item-label">Lost Image</div>
            </div>
            <div class="item-info">
                <p><strong>Match Score:</strong> ${match.manual ? 'Custom' : `${match.totalPoints}/100`}</p>
                <p><strong>Lost:</strong> ${lost.itemName} - ${lost.description || "No description"} (Reported: ${lost.timeReported || 'N/A'})</p>
                <p><strong>Found:</strong> ${found.itemName} - ${found.description || "No description"} (Reported: ${found.timeReported || 'N/A'})</p>
                <button class="view-button" onclick="openModal(${match.lostID}, ${match.foundID})">View Match</button>
                <button class="${buttonClass}" data-lostid="${lost.idLost}" data-foundid="${found.idFound}" data-index="${index}">${buttonText}</button>
            </div>
            <div class="item-section">
                <img src="${found.image || 'images/default-image.png'}" alt="Found Image">
                <div class="item-label">Found Image</div>
            </div>
        `;
        matchedListDiv.appendChild(itemDiv);
    });

    document.querySelectorAll('.match-button').forEach(button => {
        button.addEventListener('click', function () {
            const lostID = Number(this.getAttribute('data-lostid'));
            const foundID = Number(this.getAttribute('data-foundid'));
            const matchIndex = Number(this.getAttribute('data-index'));
            const lostItem = lostItems.find(item => item.idLost === lostID);
            const foundItem = foundItems.find(item => item.idFound === foundID);

            if (lostItem && lostItem.ownerEmail && foundItem) {
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
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.text();
                    })
                    .then(data => {
                        const lostIndex = lostItems.findIndex(item => item.idLost === lostID);
                        const foundIndex = foundItems.findIndex(item => item.idFound === foundID);
                        if (lostIndex !== -1) {
                            lostItems[lostIndex].status = "Matched";
                        }
                        if (foundIndex !== -1) {
                            foundItems[foundIndex].status = "Matched";
                        }
                        localStorage.setItem('lostItems', JSON.stringify(lostItems));
                        localStorage.setItem('foundItems', JSON.stringify(foundItems));

                        const matchedItems = JSON.parse(localStorage.getItem('matchedItems')) || [];
                        const visibleIndex = matchedItems.findIndex(m => m.lostID === lostID && m.foundID === foundID);
                        if (visibleIndex !== -1) {
                            matchedItems[visibleIndex].emailSent = true;
                            localStorage.setItem('matchedItems', JSON.stringify(matchedItems));
                        }

                        Swal.fire({
                            title: 'Success',
                            text: 'Match email sent successfully and status updated to Matched!',
                            icon: 'success',
                            confirmButtonText: 'OK',
                            customClass: {
                                popup: 'swal-success'
                            }
                        }).then(() => {
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

    document.querySelectorAll('.confirm-button').forEach(button => {
        button.addEventListener('click', function () {
            const lostID = Number(this.getAttribute('data-lostid'));
            const foundID = Number(this.getAttribute('data-foundid'));
            const matchIndex = Number(this.getAttribute('data-index'));

            Swal.fire({
                title: 'Confirm Match',
                text: 'This will hide the matched items from the Lost, Found, and Matched pages. Proceed?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, Confirm',
                cancelButtonText: 'Cancel',
                customClass: {
                    popup: 'swal-confirm'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
                    const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
                    const matchedItems = JSON.parse(localStorage.getItem('matchedItems')) || [];

                    const lostIndex = lostItems.findIndex(item => item.idLost === lostID);
                    const foundIndex = foundItems.findIndex(item => item.idFound === foundID);
                    const matchedIndex = matchedItems.findIndex(m => m.lostID === lostID && m.foundID === foundID);

                    if (lostIndex !== -1) {
                        lostItems[lostIndex].isVisible = false;
                    }
                    if (foundIndex !== -1) {
                        foundItems[foundIndex].isVisible = false;
                    }
                    if (matchedIndex !== -1) {
                        matchedItems[matchedIndex].isVisible = false;
                        matchedItems[matchedIndex].isConfirmed = true;
                    }

                    localStorage.setItem('lostItems', JSON.stringify(lostItems));
                    localStorage.setItem('foundItems', JSON.stringify(foundItems));
                    localStorage.setItem('matchedItems', JSON.stringify(matchedItems));

                    Swal.fire({
                        title: 'Confirmed',
                        text: 'Items have been hidden from Lost, Found, and Matched pages.',
                        icon: 'success',
                        confirmButtonText: 'OK',
                        customClass: {
                            popup: 'swal-success'
                        }
                    }).then(() => {
                        displayMatchedItems();
                    });
                }
            });
        });
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
                <img src="${lost.image || 'images/default-image.png'}" alt="Lost Item">
                <p>Lost Image</p>
            </div>
            <div>
                <img src="${found.image || 'images/default-image.png'}" alt="Found Item">
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

function match(lostItemlist, foundItemlist) {
    let matchedItems = JSON.parse(localStorage.getItem('matchedItems')) || [];
    console.log('Matching items:', { lostCount: lostItemlist.length, foundCount: foundItemlist.length });

    for (let i = 0; i < lostItemlist.length; i++) {
        for (let j = 0; j < foundItemlist.length; j++) {
            let lostID = lostItemlist[i].idLost;
            let foundID = foundItemlist[j].idFound;

            // Skip if a match (manual or automatic) already exists for this lostID and foundID
            let alreadyExists = matchedItems.some(m => m.lostID === lostID && m.foundID === foundID);
            if (alreadyExists) {
                console.log(`Skipping match for Lost ID ${lostID} and Found ID ${foundID}: Already exists in matchedItems.`);
                continue;
            }

            let itemLost = lostItemlist[i].itemName ? lostItemlist[i].itemName.toLowerCase() : '';
            let itemLostArray = itemLost.split(" ");
            let itemFound = foundItemlist[j].itemName ? foundItemlist[j].itemName.toLowerCase() : '';
            let itemFoundArray = itemFound.split(" ");
            let itemLostLocation = lostItemlist[i].lastLocated ? lostItemlist[i].lastLocated.toLowerCase() : '';
            let itemFoundLocation = foundItemlist[j].foundAt ? foundItemlist[j].foundAt.toLowerCase() : '';
            let itemLostLocationArray = itemLostLocation.split(" ");
            let itemFoundLocationArray = itemFoundLocation.split(" ");
            let itemLostCategory = lostItemlist[i].category || '';
            let itemFoundCategory = foundItemlist[j].category || '';
            const itemLostDate = lostItemlist[i].dateLost ? new Date(lostItemlist[i].dateLost) : null;
            const itemFoundDate = foundItemlist[j].dateFound ? new Date(foundItemlist[j].dateFound) : null;
            let itemLostColor = lostItemlist[i].itemColor || '#000000';
            let itemFoundColor = foundItemlist[j].itemColor || '#000000';

            let pointsItemName = points(itemLost, itemFound, itemLostArray, itemFoundArray);
            let pointsItemCategory = points(itemLostCategory, itemFoundCategory, null, null);
            let pointsLocation = points(itemLostLocation, itemFoundLocation, itemLostLocationArray, itemFoundLocationArray);
            let pointsItemDate = itemLostDate && itemFoundDate ? pointsDate(itemLostDate, itemFoundDate) : 0;
            let pointsItemColor = pointsColor(itemLostColor, itemFoundColor);

            let totalPoints = pointsItemName + pointsItemCategory + pointsLocation + pointsItemDate + pointsItemColor;
            console.log(`Match check: Lost ID ${lostID}, Found ID ${foundID}, Total Points: ${totalPoints}`);

            if (totalPoints < 70) {
                console.log(`Skipping match for Lost ID ${lostID} and Found ID ${foundID}: Total Points ${totalPoints} < 70.`);
                continue;
            }

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
            
            matchedItems.push(matched);
            console.log('New match added:', matched);
        }
    }

    localStorage.setItem('matchedItems', JSON.stringify(matchedItems));
    console.log('Updated matchedItems in localStorage:', matchedItems);
}

function pointsDate(lostDate, foundDate) {
    if (!lostDate || !foundDate) return 0;
    if (lostDate.toDateString() === foundDate.toDateString()) return 20;
    const diff = Math.abs(lostDate - foundDate);
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 20;
    if (diffDays <= 7) return 10;
    return 0;
}

function points(lost, found, lostArray, foundArray) {
    if (!lost || !found) return 0;
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
    if (!lostColor || !foundColor) return 0;
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