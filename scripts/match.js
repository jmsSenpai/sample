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

    const itemDiv = document.createElement("div");
    itemDiv.classList.add("matched-item");
    itemDiv.innerHTML = `
      <div class="item-section">
        <img src="${lost.image}" alt="Lost Image" onclick="previewImage('${lost.image}')">
        <div class="item-label">Lost Image</div>
      </div>
      <div class="item-info">
        <strong>Match Score:</strong> ${match.totalPoints}/100<br>
        <strong>Lost:</strong> ${lost.itemName} - ${lost.description || "No description"}<br>
        <strong>Found:</strong> ${found.itemName} - ${found.description || "No description"}<br>
        <button class="view-button" onclick='openModal(${JSON.stringify(JSON.stringify(lost))}, ${JSON.stringify(JSON.stringify(found))})'>View Match</button>
        <button class="match-button" data-lostid="${lost.idLost}">Send Match Email</button>
      </div>
      <div class="item-section">
        <img src="${found.image}" alt="Found Image" onclick="previewImage('${found.image}')">
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
      console.log("Lost item owner email:", lostItem.ownerEmail);
    });
  });
}



function openModal(lostData, foundData) {
  const lost = JSON.parse(lostData);
  const found = JSON.parse(foundData);

  const modalDetails = document.getElementById("modalDetails");
  modalDetails.innerHTML = `
    <h3>Match Details</h3>
    <div class="modal-images">
      <div>
        <img src="${lost.image}" alt="Lost Item" onclick="previewImage('${lost.image}')">
        <p>Lost Image</p>
      </div>
      <div>
        <img src="${found.image}" alt="Found Item" onclick="previewImage('${found.image}')">
        <p>Found Image</p>
      </div>
    </div>
    <div class="modal-details">
      <p><strong>Lost Item:</strong> ${lost.itemName}</p>
      <p><strong>Description:</strong> ${lost.description || "No description"}</p>
      <p><strong>Category:</strong> ${lost.category}</p>
      <p><strong>Color:</strong> <span style="color:${lost.itemColor}">${lost.itemColor}</span></p>
      <p><strong>Last Seen At:</strong> ${lost.lastLocated}</p>
      <p><strong>Date Lost:</strong> ${lost.dateLost}</p>
      <hr>
      <p><strong>Found Item:</strong> ${found.itemName}</p>
      <p><strong>Description:</strong> ${found.description || "No description"}</p>
      <p><strong>Category:</strong> ${found.category}</p>
      <p><strong>Color:</strong> <span style="color:${found.itemColor}">${found.itemColor}</span></p>
      <p><strong>Found At:</strong> ${found.foundAt}</p>
      <p><strong>Date Found:</strong> ${found.dateFound}</p>
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

function match(lostItemlist, foundItemlist){
  for (let i = 0; i < lostItemlist.length; i++){
    for (let index = 0; index < foundItemlist.length; index++){
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

      if (totalPoints >= 70){
        const matched = { lostID, foundID, totalPoints };
        let matchedItems = localStorageMatch;
        matchedItems.push(matched);
        localStorage.setItem('matchedItems', JSON.stringify(matchedItems));
      }
    }
  }
}

function pointsDate(lostDate, foundDate){
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
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

function pointsColor(firstColor, secondColor){
  const [r1, g1, b1] = hexToRGB(firstColor);
  const [r2, g2, b2] = hexToRGB(secondColor);
  const distance = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  if (distance < 30) return 20;
  if (distance < 60) return 10;
  return 0;
}
