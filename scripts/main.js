if (!localStorage.getItem("loggedInAdmin")) {
    window.location.href = "admin-login.html";
  }
  
  function showTab(tabId) {
    console.log(`Showing tab: ${tabId}`);
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.style.display = 'none';
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(tabId).style.display = 'block';
    document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');
    loadReportsForTab(tabId);
  }
  
  function loadReportsForTab(tabId) {
    console.log(`Loading reports for tab: ${tabId}`);
    const startDate = document.getElementById("startDate").value ? new Date(document.getElementById("startDate").value) : null;
    const endDate = document.getElementById("endDate").value ? new Date(document.getElementById("endDate").value) : null;
    const status = document.getElementById("statusFilter").value;
  
    if (endDate) {
        endDate.setHours(23, 59, 59, 999);
    }
  
    const lostList = document.getElementById("recentLostItems");
    const foundList = document.getElementById("recentFoundItems");
    const matchedList = document.getElementById("matchedItems");
  
    let lostItems = JSON.parse(localStorage.getItem("lostItems")) || [];
    let foundItems = JSON.parse(localStorage.getItem("foundItems")) || [];
    let matchedItems = JSON.parse(localStorage.getItem("matchedItems")) || [];
  
    // Ensure IDs are valid numbers
    lostItems = lostItems.map((item, index) => ({
        ...item,
        idLost: item.idLost !== undefined ? Number(item.idLost) : index + 1,
        status: item.status || (matchedItems.some(m => Number(m.lostID) === Number(item.idLost)) ? "Matched" : "Pending")
    }));
  
    foundItems = foundItems.map((item, index) => ({
        ...item,
        idFound: item.idFound !== undefined ? Number(item.idFound) : index + 1,
        status: item.status || (matchedItems.some(m => Number(m.foundID) === Number(item.idFound)) ? "Matched" : "Pending")
    }));
  
    if (tabId === 'lostTab') {
        lostList.innerHTML = "";
        let filteredLostItems = lostItems;
        if (startDate && endDate) {
            filteredLostItems = filteredLostItems.filter(item => {
                const itemDate = new Date(item.dateLost);
                return itemDate >= startDate && itemDate <= endDate;
            });
        }
        if (status && status !== "All") {
            filteredLostItems = filteredLostItems.filter(item => item.status === status);
        }
        console.log(`Rendering ${filteredLostItems.length} lost items`);
        filteredLostItems.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${item.itemName}</strong> - Last located at: ${item.lastLocated}<br>
                ${item.description || "No description"}<br>
                <p>Time Reported: ${item.timeReported || "N/A"}</p> <!-- New field -->
                <p>Status: ${item.status}</p>
                <button class="action-button" onclick="viewLostItem(${item.idLost})">View Details</button>
                <button class="action-button delete-button" onclick="deleteLostItem(${item.idLost})">Delete</button>
            `;
            lostList.appendChild(li);
        });
    } else if (tabId === 'foundTab') {
        foundList.innerHTML = "";
        let filteredFoundItems = foundItems;
        if (startDate && endDate) {
            filteredFoundItems = filteredFoundItems.filter(item => {
                const itemDate = new Date(item.dateFound);
                return itemDate >= startDate && itemDate <= endDate;
            });
        }
        if (status && status !== "All") {
            filteredFoundItems = filteredFoundItems.filter(item => item.status === status);
        }
        console.log(`Rendering ${filteredFoundItems.length} found items`);
        filteredFoundItems.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${item.itemName}</strong> - ${item.foundAt}<br>
                ${item.description || "No description"}<br>
                <p>Time Reported: ${item.timeReported || "N/A"}</p> <!-- New field -->
                <p>Status: ${item.status}</p>
                <button class="action-button" onclick="viewFoundItem(${item.idFound})">View Details</button>
                <button class="action-button delete-button" onclick="deleteFoundItem(${item.idFound})">Delete</button>
            `;
            foundList.appendChild(li);
        });
    } else if (tabId === 'matchedTab') {
        matchedList.innerHTML = "";
        let filteredMatchedItems = matchedItems;
        if (startDate && endDate) {
            filteredMatchedItems = filteredMatchedItems.filter(match => {
                const matchDate = new Date(match.itemLostDate);
                return matchDate >= startDate && matchDate <= endDate;
            });
        }
        console.log(`Rendering ${filteredMatchedItems.length} matched items`);
        filteredMatchedItems.forEach(match => {
            const lost = lostItems.find(item => Number(item.idLost) === Number(match.lostID));
            const found = foundItems.find(item => Number(item.idFound) === Number(match.foundID));
            if (!lost || !found) return;
            const li = document.createElement("li");
            li.classList.add("matched-item");
            li.innerHTML = `
                <strong>Lost:</strong> ${lost.itemName} (Reported: ${lost.timeReported || "N/A"}) - 
                <strong>Found:</strong> ${found.itemName} (Reported: ${found.timeReported || "N/A"})<br>
                <p>Match Score: ${match.totalPoints}/100</p>
                <button class="action-button" onclick="viewMatchedItem(${match.lostID}, ${match.foundID})">View Details</button>
                <button class="action-button delete-button" onclick="deleteMatchedItem(${match.lostID}, ${match.foundID})">Delete</button>
            `;
            matchedList.appendChild(li);
        });
    }
  }
  
  function applyFilters() {
    const activeTab = document.querySelector('.tab-pane.active').id;
    console.log(`Applying filters for tab: ${activeTab}`);
    loadReportsForTab(activeTab);
  }
  
  function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
  }
  
  function viewLostItem(id) {
    console.log(`Viewing lost item with ID: ${id}`);
    const items = JSON.parse(localStorage.getItem("lostItems")) || [];
    const matchedItems = JSON.parse(localStorage.getItem("matchedItems")) || [];
    const item = items.find(i => Number(i.idLost) === Number(id));
    if (!item) {
        console.error(`Lost item not found. ID: ${id}`);
        alert("Lost item not found.");
        return;
    }
  
    document.getElementById("viewLostName").innerText = item.itemName || "N/A";
    document.getElementById("viewLostCategory").innerText = item.category || "N/A";
    document.getElementById("viewLostLastLocated").innerText = item.lastLocated || "N/A";
    document.getElementById("viewLostDateLost").innerText = item.dateLost || "N/A";
    document.getElementById("viewLostTimeReported").innerText = item.timeReported || "N/A"; // New field
    document.getElementById("viewLostColor").innerHTML = `<div class="color-rectangle" style="background-color: ${item.itemColor || '#ccc'};"></div>`; // Updated to show color rectangle
    document.getElementById("viewLostDescription").innerText = item.description || "No description";
    document.getElementById("viewLostReportedBy").innerText = item.reportedBy || "N/A";
    document.getElementById("viewLostStatus").innerText = item.status || (matchedItems.some(m => Number(m.lostID) === Number(id)) ? "Matched" : "Pending");
  
    const viewImage = document.getElementById("viewLostImage");
    viewImage.src = item.image || "images/default-image.png";
  
    document.getElementById("viewLostItemModal").style.display = "flex";
  }
  
  function viewFoundItem(id) {
    console.log(`Viewing found item with ID: ${id}`);
    const items = JSON.parse(localStorage.getItem("foundItems")) || [];
    const matchedItems = JSON.parse(localStorage.getItem("matchedItems")) || [];
    const item = items.find(i => Number(i.idFound) === Number(id));
    if (!item) {
        console.error(`Found item not found. ID: ${id}`);
        alert("Found item not found.");
        return;
    }
  
    document.getElementById("viewFoundName").innerText = item.itemName || "N/A";
    document.getElementById("viewFoundCategory").innerText = item.category || "N/A";
    document.getElementById("viewFoundFoundAt").innerText = item.foundAt || "N/A";
    document.getElementById("viewFoundDateFound").innerText = item.dateFound || "N/A";
    document.getElementById("viewFoundTimeReported").innerText = item.timeReported || "N/A"; // New field
    document.getElementById("viewFoundColor").innerHTML = `<div class="color-rectangle" style="background-color: ${item.itemColor || '#ccc'};"></div>`; // Updated to show color rectangle
    document.getElementById("viewFoundDescription").innerText = item.description || "No description";
    document.getElementById("viewFoundReportedBy").innerText = item.reportedBy || "N/A";
    document.getElementById("viewFoundStatus").innerText = item.status || (matchedItems.some(m => Number(m.foundID) === Number(id)) ? "Matched" : "Pending");
  
    const viewImage = document.getElementById("viewFoundImage");
    viewImage.src = item.image || "images/default-image.png";
  
    document.getElementById("viewFoundItemModal").style.display = "flex";
  }
  
  function viewMatchedItem(lostID, foundID) {
    console.log(`Viewing matched item with Lost ID: ${lostID}, Found ID: ${foundID}`);
    const lostItems = JSON.parse(localStorage.getItem("lostItems")) || [];
    const foundItems = JSON.parse(localStorage.getItem("foundItems")) || [];
    const matchedItems = JSON.parse(localStorage.getItem("matchedItems")) || [];
    const lost = lostItems.find(item => Number(item.idLost) === Number(lostID));
    const found = foundItems.find(item => Number(item.idFound) === Number(foundID));
    const match = matchedItems.find(m => Number(m.lostID) === Number(lostID) && Number(m.foundID) === Number(foundID));
  
    if (!lost || !found || !match) {
        console.error(`Match details not found. Lost ID: ${lostID}, Found ID: ${foundID}`);
        alert("Cannot display match details: Item data not found.");
        return;
    }
  
    document.getElementById("viewMatchScore").innerText = `${match.totalPoints}/100`;
    document.getElementById("viewMatchLostName").innerText = lost.itemName || "N/A";
    document.getElementById("viewMatchLostDescription").innerText = lost.description || "No description";
    document.getElementById("viewMatchLostCategory").innerText = lost.category || "N/A";
    document.getElementById("viewMatchLostColor").innerHTML = `<div class="color-rectangle" style="background-color: ${lost.itemColor || '#ccc'};"></div>`; // Updated to show color rectangle
    document.getElementById("viewMatchLostLocation").innerText = lost.lastLocated || "N/A";
    document.getElementById("viewMatchLostDate").innerText = lost.dateLost || "N/A";
    document.getElementById("viewMatchLostTimeReported").innerText = lost.timeReported || "N/A"; // New field
    document.getElementById("viewMatchLostReportedBy").innerText = lost.reportedBy || "N/A";
    document.getElementById("viewMatchFoundName").innerText = found.itemName || "N/A";
    document.getElementById("viewMatchFoundDescription").innerText = found.description || "No description";
    document.getElementById("viewMatchFoundCategory").innerText = found.category || "N/A";
    document.getElementById("viewMatchFoundColor").innerHTML = `<div class="color-rectangle" style="background-color: ${found.itemColor || '#ccc'};"></div>`; // Updated to show color rectangle
    document.getElementById("viewMatchFoundLocation").innerText = found.foundAt || "N/A";
    document.getElementById("viewMatchFoundDate").innerText = found.dateFound || "N/A";
    document.getElementById("viewMatchFoundTimeReported").innerText = found.timeReported || "N/A"; // New field
    document.getElementById("viewMatchFoundReportedBy").innerText = found.reportedBy || "N/A";
  
    document.getElementById("viewMatchLostImage").src = lost.image || "images/default-image.png";
    document.getElementById("viewMatchFoundImage").src = found.image || "images/default-image.png";
  
    document.getElementById("viewMatchModal").style.display = "flex";
  }
  
  function printLostItem() {
    console.log("Printing single lost item report");
    const content = `
        <h2>Lost Item Report</h2>
        <p><strong>Name:</strong> ${document.getElementById("viewLostName").innerText}</p>
        <p><strong>Category:</strong> ${document.getElementById("viewLostCategory").innerText}</p>
        <p><strong>Last Located:</strong> ${document.getElementById("viewLostLastLocated").innerText}</p>
        <p><strong>Date Lost:</strong> ${document.getElementById("viewLostDateLost").innerText}</p>
        <p><strong>Time Reported:</strong> ${document.getElementById("viewLostTimeReported").innerText}</p> <!-- New field -->
        <p><strong>Color:</strong> ${document.getElementById("viewLostColor").innerText}</p>
        <p><strong>Description:</strong> ${document.getElementById("viewLostDescription").innerText}</p>
        <p><strong>Reported By:</strong> ${document.getElementById("viewLostReportedBy").innerText}</p>
        <p><strong>Status:</strong> ${document.getElementById("viewLostStatus").innerText}</p>
        <img src="${document.getElementById("viewLostImage").src}" style="max-width:200px;">
    `;
    printReport(content);
  }
  
  function printFoundItem() {
    console.log("Printing single found item report");
    const content = `
        <h2>Found Item Report</h2>
        <p><strong>Name:</strong> ${document.getElementById("viewFoundName").innerText}</p>
        <p><strong>Category:</strong> ${document.getElementById("viewFoundCategory").innerText}</p>
        <p><strong>Found At:</strong> ${document.getElementById("viewFoundFoundAt").innerText}</p>
        <p><strong>Date Found:</strong> ${document.getElementById("viewFoundDateFound").innerText}</p>
        <p><strong>Time Reported:</strong> ${document.getElementById("viewFoundTimeReported").innerText}</p> <!-- New field -->
        <p><strong>Color:</strong> ${document.getElementById("viewFoundColor").innerText}</p>
        <p><strong>Description:</strong> ${document.getElementById("viewFoundDescription").innerText}</p>
        <p><strong>Reported By:</strong> ${document.getElementById("viewFoundReportedBy").innerText}</p>
        <p><strong>Status:</strong> ${document.getElementById("viewFoundStatus").innerText}</p>
        <img src="${document.getElementById("viewFoundImage").src}" style="max-width:200px;">
    `;
    printReport(content);
  }
  
  function printMatchedItem() {
    console.log("Printing single matched item report");
    const content = `
        <h2>Matched Item Report</h2>
        <p><strong>Match Score:</strong> ${document.getElementById("viewMatchScore").innerText}</p>
        <h3>Lost Item</h3>
        <p><strong>Name:</strong> ${document.getElementById("viewMatchLostName").innerText}</p>
        <p><strong>Description:</strong> ${document.getElementById("viewMatchLostDescription").innerText}</p>
        <p><strong>Category:</strong> ${document.getElementById("viewMatchLostCategory").innerText}</p>
        <p><strong>Color:</strong> ${document.getElementById("viewMatchLostColor").innerText}</p>
        <p><strong>Last Seen At:</strong> ${document.getElementById("viewMatchLostLocation").innerText}</p>
        <p><strong>Date Lost:</strong> ${document.getElementById("viewMatchLostDate").innerText}</p>
        <p><strong>Time Reported:</strong> ${document.getElementById("viewMatchLostTimeReported").innerText}</p> <!-- New field -->
        <p><strong>Reported By:</strong> ${document.getElementById("viewMatchLostReportedBy").innerText}</p>
        <img src="${document.getElementById("viewMatchLostImage").src}" style="max-width:200px;">
        <h3>Found Item</h3>
        <p><strong>Name:</strong> ${document.getElementById("viewMatchFoundName").innerText}</p>
        <p><strong>Description:</strong> ${document.getElementById("viewMatchFoundDescription").innerText}</p>
        <p><strong>Category:</strong> ${document.getElementById("viewMatchFoundCategory").innerText}</p>
        <p><strong>Color:</strong> ${document.getElementById("viewMatchFoundColor").innerText}</p>
        <p><strong>Found At:</strong> ${document.getElementById("viewMatchFoundLocation").innerText}</p>
        <p><strong>Date Found:</strong> ${document.getElementById("viewMatchFoundDate").innerText}</p>
        <p><strong>Time Reported:</strong> ${document.getElementById("viewMatchFoundTimeReported").innerText}</p> <!-- New field -->
        <p><strong>Reported By:</strong> ${document.getElementById("viewMatchFoundReportedBy").innerText}</p>
        <img src="${document.getElementById("viewMatchFoundImage").src}" style="max-width:200px;">
    `;
    printReport(content);
  }
  
  function printAllLostItems() {
    console.log("Printing all lost items report");
    const lostItems = JSON.parse(localStorage.getItem("lostItems")) || [];
    const matchedItems = JSON.parse(localStorage.getItem("matchedItems")) || [];
    const startDate = document.getElementById("startDate").value ? new Date(document.getElementById("startDate").value) : null;
    const endDate = document.getElementById("endDate").value ? new Date(document.getElementById("endDate").value) : null;
    const status = document.getElementById("statusFilter").value;
  
    if (endDate) {
        endDate.setHours(23, 59, 59, 999);
    }
  
    let filteredLostItems = lostItems.map(item => ({
        ...item,
        status: item.status || (matchedItems.some(m => Number(m.lostID) === Number(item.idLost)) ? "Matched" : "Pending")
    }));
  
    if (startDate && endDate) {
        filteredLostItems = filteredLostItems.filter(item => {
            const itemDate = new Date(item.dateLost);
            return itemDate >= startDate && itemDate <= endDate;
        });
    }
    if (status && status !== "All") {
        filteredLostItems = filteredLostItems.filter(item => item.status === status);
    }
  
    let content = '<h2>All Lost Items Report</h2>';
    if (filteredLostItems.length === 0) {
        content += '<p>No lost items found.</p>';
    } else {
        filteredLostItems.forEach(item => {
            content += `
                <div class="report-item">
                    <h3>Lost Item: ${item.itemName || "N/A"}</h3>
                    <p><strong>Category:</strong> ${item.category || "N/A"}</p>
                    <p><strong>Last Located:</strong> ${item.lastLocated || "N/A"}</p>
                    <p><strong>Date Lost:</strong> ${item.dateLost || "N/A"}</p>
                    <p><strong>Time Reported:</strong> ${item.timeReported || "N/A"}</p> <!-- New field -->
                    <p><strong>Color:</strong> ${item.itemColor || "N/A"}</p>
                    <p><strong>Description:</strong> ${item.description || "No description"}</p>
                    <p><strong>Reported By:</strong> ${item.reportedBy || "N/A"}</p>
                    <p><strong>Status:</strong> ${item.status}</p>
                    <img src="${item.image || "images/default-image.png"}" style="max-width:200px;">
                    <hr>
                </div>
            `;
        });
    }
    printReport(content);
  }
  
  function printAllFoundItems() {
    console.log("Printing all found items report");
    const foundItems = JSON.parse(localStorage.getItem("foundItems")) || [];
    const matchedItems = JSON.parse(localStorage.getItem("matchedItems")) || [];
    const startDate = document.getElementById("startDate").value ? new Date(document.getElementById("startDate").value) : null;
    const endDate = document.getElementById("endDate").value ? new Date(document.getElementById("endDate").value) : null;
    const status = document.getElementById("statusFilter").value;
  
    if (endDate) {
        endDate.setHours(23, 59, 59, 999);
    }
  
    let filteredFoundItems = foundItems.map(item => ({
        ...item,
        status: item.status || (matchedItems.some(m => Number(m.foundID) === Number(item.idFound)) ? "Matched" : "Pending")
    }));
  
    if (startDate && endDate) {
        filteredFoundItems = filteredFoundItems.filter(item => {
            const itemDate = new Date(item.dateFound);
            return itemDate >= startDate && itemDate <= endDate;
        });
    }
    if (status && status !== "All") {
        filteredFoundItems = filteredFoundItems.filter(item => item.status === status);
    }
  
    let content = '<h2>All Found Items Report</h2>';
    if (filteredFoundItems.length === 0) {
        content += '<p>No found items found.</p>';
    } else {
        filteredFoundItems.forEach(item => {
            content += `
                <div class="report-item">
                    <h3>Found Item: ${item.itemName || "N/A"}</h3>
                    <p><strong>Category:</strong> ${item.category || "N/A"}</p>
                    <p><strong>Found At:</strong> ${item.foundAt || "N/A"}</p>
                    <p><strong>Date Found:</strong> ${item.dateFound || "N/A"}</p>
                    <p><strong>Time Reported:</strong> ${item.timeReported || "N/A"}</p> <!-- New field -->
                    <p><strong>Color:</strong> ${item.itemColor || "N/A"}</p>
                    <p><strong>Description:</strong> ${item.description || "No description"}</p>
                    <p><strong>Reported By:</strong> ${item.reportedBy || "N/A"}</p>
                    <p><strong>Status:</strong> ${item.status}</p>
                    <img src="${item.image || "images/default-image.png"}" style="max-width:200px;">
                    <hr>
                </div>
            `;
        });
    }
    printReport(content);
  }
  
  function printAllMatchedItems() {
    console.log("Printing all matched items report");
    const lostItems = JSON.parse(localStorage.getItem("lostItems")) || [];
    const foundItems = JSON.parse(localStorage.getItem("foundItems")) || [];
    const matchedItems = JSON.parse(localStorage.getItem("matchedItems")) || [];
    const startDate = document.getElementById("startDate").value ? new Date(document.getElementById("startDate").value) : null;
    const endDate = document.getElementById("endDate").value ? new Date(document.getElementById("endDate").value) : null;
  
    if (endDate) {
        endDate.setHours(23, 59, 59, 999);
    }
  
    let filteredMatchedItems = matchedItems;
    if (startDate && endDate) {
        filteredMatchedItems = filteredMatchedhljs
        filteredMatchedItems.filter(match => {
            const matchDate = new Date(match.itemLostDate);
            return matchDate >= startDate && matchDate <= endDate;
        });
    }
  
    let content = '<h2>All Matched Items Report</h2>';
    if (filteredMatchedItems.length === 0) {
        content += '<p>No matched items found.</p>';
    } else {
        filteredMatchedItems.forEach(match => {
            const lost = lostItems.find(item => Number(item.idLost) === Number(match.lostID));
            const found = foundItems.find(item => Number(item.idFound) === Number(match.foundID));
            if (!lost || !found) return;
            content += `
                <div class="report-item">
                    <h3>Match: ${lost.itemName} - ${found.itemName}</h3>
                    <p><strong>Match Score:</strong> ${match.totalPoints}/100</p>
                    <h4>Lost Item</h4>
                    <p><strong>Name:</strong> ${lost.itemName || "N/A"}</p>
                    <p><strong>Description:</strong> ${lost.description || "No description"}</p>
                    <p><strong>Category:</strong> ${lost.category || "N/A"}</p>
                    <p><strong>Color:</strong> ${lost.itemColor || "N/A"}</p>
                    <p><strong>Last Seen At:</strong> ${lost.lastLocated || "N/A"}</p>
                    <p><strong>Date Lost:</strong> ${lost.dateLost || "N/A"}</p>
                    <p><strong>Time Reported:</strong> ${lost.timeReported || "N/A"}</p> <!-- New field -->
                    <p><strong>Reported By:</strong> ${lost.reportedBy || "N/A"}</p>
                    <img src="${lost.image || "images/default-image.png"}" style="max-width:200px;">
                    <h4>Found Item</h4>
                    <p><strong>Name:</strong> ${found.itemName || "N/A"}</p>
                    <p><strong>Description:</strong> ${found.description || "No description"}</p>
                    <p><strong>Category:</strong> ${found.category || "N/A"}</p>
                    <p><strong>Color:</strong> ${found.itemColor || "N/A"}</p>
                    <p><strong>Found At:</strong> ${found.foundAt || "N/A"}</p>
                    <p><strong>Date Found:</strong> ${found.dateFound || "N/A"}</p>
                    <p><strong>Time Reported:</strong> ${found.timeReported || "N/A"}</p> <!-- New field -->
                    <p><strong>Reported By:</strong> ${found.reportedBy || "N/A"}</p>
                    <img src="${found.image || "images/default-image.png"}" style="max-width:200px;">
                    <hr>
                </div>
            `;
        });
    }
    printReport(content);
  }
  
  function printReport(content) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Print Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h2 { color: #333; }
                h3 { color: #555; margin-top: 20px; }
                h4 { color: #666; margin-top: 15px; }
                p { margin: 5px 0; }
                img { margin-top: 10px; }
                hr { margin: 20px 0; }
                .report-item { margin-bottom: 20px; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
  
  function deleteLostItem(id) {
    console.log(`Deleting lost item with ID: ${id}`);
    let items = JSON.parse(localStorage.getItem("lostItems")) || [];
    const initialLength = items.length;
    items = items.filter(i => Number(i.idLost) !== Number(id));
    if (items.length === initialLength) {
        console.error(`No lost item found with ID: ${id}`);
        alert("No lost item found to delete.");
        return;
    }
    localStorage.setItem("lostItems", JSON.stringify(items));
    console.log(`Lost item deleted. Remaining items: ${items.length}`);
    applyFilters();
  }
  
  function deleteFoundItem(id) {
    console.log(`Deleting found item with ID: ${id}`);
    let items = JSON.parse(localStorage.getItem("foundItems")) || [];
    const initialLength = items.length;
    items = items.filter(i => Number(i.idFound) !== Number(id));
    if (items.length === initialLength) {
        console.error(`No found item found with ID: ${id}`);
        alert("No found item found to delete.");
        return;
    }
    localStorage.setItem("foundItems", JSON.stringify(items));
    console.log(`Found item deleted. Remaining items: ${items.length}`);
    applyFilters();
  }
  
  function deleteMatchedItem(lostID, foundID) {
    console.log(`Deleting matched item with Lost ID: ${lostID}, Found ID: ${foundID}`);
    let matchedItems = JSON.parse(localStorage.getItem("matchedItems")) || [];
    const initialLength = matchedItems.length;
    matchedItems = matchedItems.filter(match => !(Number(match.lostID) === Number(lostID) && Number(match.foundID) === Number(foundID)));
    if (matchedItems.length === initialLength) {
        console.error(`No matched item found with Lost ID: ${lostID}, Found ID: ${foundID}`);
        alert("No matched item found to delete.");
        return;
    }
    localStorage.setItem("matchedItems", JSON.stringify(matchedItems));
    console.log(`Matched item deleted. Remaining matches: ${matchedItems.length}`);
    applyFilters();
  }
  
  function previewImage(src) {
    console.log(`Previewing image: ${src}`);
    const modal = document.getElementById("imageModal");
    const img = document.getElementById("previewImg");
    img.src = src;
    modal.style.display = "block";
  }
  
  function closeImageModal() {
    document.getElementById("imageModal").style.display = "none";
  }
  
  document.addEventListener("DOMContentLoaded", function () {
    console.log("Page loaded, initializing...");
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
            console.log("Logging out...");
            document.body.classList.add("fade-out");
            setTimeout(function () {
                localStorage.removeItem("loggedInAdmin");
                const inputs = document.querySelectorAll("input");
                inputs.forEach(input => input.value = "");
                window.location.href = "admin-login.html";
            }, 1000);
        });
    }
  
    showTab('lostTab');
  });