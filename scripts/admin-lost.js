document.addEventListener("DOMContentLoaded", function () {
  // Authentication check
  if (!localStorage.getItem("loggedInAdmin")) {
      Swal.fire({
          title: 'Unauthorized Access',
          text: 'Please log in to view lost items.',
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

  // Display lost items on page load
  displayLostItems();
});

let lostItemToMatch = null;
let selectedFoundItemIndex = null;

function displayLostItems() {
  const lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
  const visibleLostItems = lostItems.filter(item => item.isVisible !== false);
  const itemsList = document.getElementById('items-list');
  itemsList.innerHTML = '';

  if (visibleLostItems.length === 0) {
      const noItemsMessage = document.createElement('div');
      noItemsMessage.classList.add('no-items-message');
      noItemsMessage.innerText = 'There are no lost items yet.';
      itemsList.appendChild(noItemsMessage);
      return;
  }

  visibleLostItems.forEach((item, index) => {
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
              <button class="see-details" onclick="showDetails(${lostItems.indexOf(item)})">See Details</button>
          </div>
      `;
      itemsList.appendChild(itemDiv);
  });
}

function showDetails(index) {
  const lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
  const item = lostItems[index];

  document.getElementById('modal-studentName').innerText = item.name || 'N/A';
  document.getElementById('modal-category').innerText = item.category || 'N/A';
  document.getElementById('modal-itemName').innerText = item.itemName || 'N/A';
  document.getElementById('modal-lastLocated').innerText = item.lastLocated || 'N/A';
  document.getElementById('modal-description').innerText = item.description || 'No description';
  const colorDiv = document.getElementById('modal-itemColor');
  colorDiv.style.backgroundColor = item.itemColor || '#ccc';
  document.getElementById('modal-dateLost').innerText = item.dateLost || 'N/A';
  document.getElementById('modal-timeReported').innerText = item.timeReported || 'N/A';
  document.getElementById('modal-image').src = item.image || 'images/default-image.png';
  document.getElementById('modal-status').innerText = item.status || 'Pending';
  document.getElementById('detailsModal').style.display = 'block';
  document.getElementById('detailsModal').setAttribute('data-index', index);
}

function openMatchModal() {
  const lostItemIndex = document.getElementById('detailsModal').getAttribute('data-index');
  const lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
  lostItemToMatch = lostItems[lostItemIndex];

  const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
  const matchedItems = JSON.parse(localStorage.getItem('matchedItems')) || [];
  const matchedFoundIDs = matchedItems.map(match => match.foundID);
  const unmatchedFoundItems = foundItems.filter(item => !matchedFoundIDs.includes(item.idFound));

  const foundItemsList = document.getElementById('found-items-list');
  foundItemsList.innerHTML = '';

  unmatchedFoundItems.forEach((item, index) => {
      const button = document.createElement('button');
      button.innerText = `${item.itemName} (${item.foundAt})`;
      button.onclick = function () {
          selectedFoundItemIndex = foundItems.findIndex(f => f.idFound === item.idFound);
          document.querySelectorAll('#found-items-list button').forEach(btn => btn.classList.remove('selected'));
          button.classList.add('selected');
      };
      foundItemsList.appendChild(button);
  });

  document.getElementById('matchModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('detailsModal').style.display = 'none';
}

function closeMatchModal() {
  document.getElementById('matchModal').style.display = 'none';
  selectedFoundItemIndex = null;
}

function saveMatch() {
  if (lostItemToMatch && selectedFoundItemIndex !== null) {
      const foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
      const selectedFoundItem = foundItems[selectedFoundItemIndex];

      const match = {
          lostID: lostItemToMatch.idLost,
          foundID: selectedFoundItem.idFound,
          totalPoints: "Custom",
          itemLost: lostItemToMatch.itemName.toLowerCase(),
          itemFound: selectedFoundItem.itemName.toLowerCase(),
          itemLostLocation: lostItemToMatch.lastLocated.toLowerCase(),
          itemFoundLocation: selectedFoundItem.foundAt.toLowerCase(),
          itemLostDate: lostItemToMatch.dateLost,
          itemFoundDate: selectedFoundItem.dateFound,
          manual: true,
          emailSent: false,
          isConfirmed: false,
          isVisible: true
      };

      let matchedItems = JSON.parse(localStorage.getItem('matchedItems')) || [];
      matchedItems.push(match);
      localStorage.setItem('matchedItems', JSON.stringify(matchedItems));

      // Close the match modal immediately
      document.getElementById('detailsModal').style.display = 'none';
      document.getElementById('matchModal').style.display = 'none';

      Swal.fire({
          title: 'Success',
          text: `Match saved: ${lostItemToMatch.itemName} with ${selectedFoundItem.itemName} (Score: Custom)`,
          icon: 'success',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-success'
          }
      }).then(() => {
          // Close the details modal after confirmation

          selectedFoundItemIndex = null;
          lostItemToMatch = null;
          displayLostItems();
      });
  } else {

    document.getElementById('detailsModal').style.display = 'none';
    document.getElementById('matchModal').style.display = 'none';
      Swal.fire({
          title: 'Error',
          text: 'Please select a found item to match.',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-error'
          }
      });
  }
}