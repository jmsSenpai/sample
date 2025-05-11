document.addEventListener("DOMContentLoaded", function () {
  // Authentication check
  if (!localStorage.getItem("loggedInAdmin")) {
      Swal.fire({
          title: 'Unauthorized Access',
          text: 'Please log in to view found items.',
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

  // Update footer with admin name
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

  // Logout handler
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

  // Display found items on page load
  displayFoundItems();
});

let foundItemToMatch = null;
let selectedLostItemIndex = null;

function displayFoundItems() {
  const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
  const visibleFoundItems = foundItems.filter(item => item.isVisible !== false);
  const itemsList = document.getElementById('items-list');
  itemsList.innerHTML = '';

  if (visibleFoundItems.length === 0) {
      const noItemsMessage = document.createElement('div');
      noItemsMessage.classList.add('no-items-message');
      noItemsMessage.innerText = 'There are no found items yet.';
      itemsList.appendChild(noItemsMessage);
      return;
  }

  visibleFoundItems.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('item');
      itemDiv.innerHTML = `
          <img src="${item.image || 'images/default-image.png'}" alt="Item Image">
          <div class="item-content">
              <p><strong>Reported By:</strong> ${item.name || 'N/A'}</p>
              <p><strong>Description:</strong> ${item.description || 'No description'}</p>
              <p><strong>Time Reported:</strong> ${item.timeReported || 'N/A'}</p>
              <p><strong>Status:</strong> ${item.status || 'Pending'}</p>
          </div>
          <div class="button-group">
              <button class="see-details" onclick="showDetails(${foundItems.indexOf(item)})">See Details</button>
          </div>
      `;
      itemsList.appendChild(itemDiv);
  });
}

function showDetails(index) {
  const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
  const item = foundItems[index];

  document.getElementById('modal-studentName').innerText = item.name || 'N/A';
  document.getElementById('modal-category').innerText = item.category || 'N/A';
  document.getElementById('modal-itemName').innerText = item.itemName || 'N/A';
  document.getElementById('modal-foundLocation').innerText = item.foundAt || 'N/A';
  document.getElementById('modal-description').innerText = item.description || 'No description';
  const colorDiv = document.getElementById('modal-itemColor');
  colorDiv.style.backgroundColor = item.itemColor || '#ccc';
  document.getElementById('modal-dateFound').innerText = item.dateFound || 'N/A';
  document.getElementById('modal-timeReported').innerText = item.timeReported || 'N/A';
  document.getElementById('modal-image').src = item.image || 'images/default-image.png';
  document.getElementById('modal-status').innerText = item.status || 'Pending';
  document.getElementById('detailsModal').style.display = 'block';
  document.getElementById('detailsModal').setAttribute('data-index', index);
}

function openMatchModal() {
  const foundItemIndex = document.getElementById('detailsModal').getAttribute('data-index');
  const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
  foundItemToMatch = foundItems[foundItemIndex];

  const lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
  const matchedItems = JSON.parse(localStorage.getItem('matchedItems')) || [];
  const matchedLostIDs = matchedItems.map(match => match.lostID);
  const unmatchedLostItems = lostItems.filter(item => !matchedLostIDs.includes(item.idLost));

  const lostItemsList = document.getElementById('lost-items-list');
  lostItemsList.innerHTML = '';

  unmatchedLostItems.forEach((item, index) => {
      const button = document.createElement('button');
      button.innerText = `${item.itemName} (${item.lastLocated})`;
      button.onclick = function () {
          selectedLostItemIndex = lostItems.findIndex(l => l.idLost === item.idLost);
          document.querySelectorAll('#lost-items-list button').forEach(btn => btn.classList.remove('selected'));
          button.classList.add('selected');
      };
      lostItemsList.appendChild(button);
  });

  document.getElementById('matchModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('detailsModal').style.display = 'none';
}

function closeMatchModal() {
  document.getElementById('matchModal').style.display = 'none';
  selectedLostItemIndex = null;
}

function saveMatch() {
  if (foundItemToMatch && selectedLostItemIndex !== null) {
      const lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
      const selectedLostItem = lostItems[selectedLostItemIndex];

      const match = {
          lostID: selectedLostItem.idLost,
          foundID: foundItemToMatch.idFound,
          totalPoints: "Custom",
          itemLost: selectedLostItem.itemName.toLowerCase(),
          itemFound: foundItemToMatch.itemName.toLowerCase(),
          itemLostLocation: selectedLostItem.lastLocated.toLowerCase(),
          itemFoundLocation: foundItemToMatch.foundAt.toLowerCase(),
          itemLostDate: selectedLostItem.dateLost,
          itemFoundDate: foundItemToMatch.dateFound,
          manual: true,
          emailSent: false,
          isConfirmed: false,
          isVisible: true
      };

      let matchedItems = JSON.parse(localStorage.getItem('matchedItems')) || [];
      matchedItems.push(match);
      localStorage.setItem('matchedItems', JSON.stringify(matchedItems));

      // Close the match modal immediately
      document.getElementById('matchModal').style.display = 'none';
      document.getElementById('detailsModal').style.display = 'none';
      Swal.fire({
          title: 'Success',
          text: `Match saved: ${foundItemToMatch.itemName} with ${selectedLostItem.itemName} (Score: Custom)`,
          icon: 'success',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-success'
          }
      }).then(() => {
          // Close the details modal after confirmation
          
          selectedLostItemIndex = null;
          foundItemToMatch = null;
          displayFoundItems();
      });
  } else {
    document.getElementById('detailsModal').style.display = 'none';
    document.getElementById('matchModal').style.display = 'none';
      Swal.fire({
          title: 'Error',
          text: 'Please select a lost item to match.',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-error'
          }
      });
  }
}