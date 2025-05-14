if (!localStorage.getItem("loggedInAdmin")) {
  window.location.href = "admin-login.html";
}

function loadTrashbinItems() {
  console.log("Loading trash bin items...");
  const tbody = document.getElementById("trashbinItems");
  tbody.innerHTML = "";
  let trashbinItems = JSON.parse(localStorage.getItem("trashbinItems")) || [];

  if (trashbinItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No items in trash bin.</td></tr>';
      return;
  }

  trashbinItems.forEach((entry, index) => {
      const { type, item, deletedAt } = entry;
      let name = "";
      let details = "";

      if (type === "lost") {
          name = item.itemName || "N/A";
          details = `Last Located: ${item.lastLocated || "N/A"}`;
      } else if (type === "found") {
          name = item.itemName || "N/A";
          details = `Found At: ${item.foundAt || "N/A"}`;
      } else if (type === "matched") {
          const lostItems = JSON.parse(localStorage.getItem("lostItems")) || [];
          const foundItems = JSON.parse(localStorage.getItem("foundItems")) || [];
          const lost = lostItems.find(i => Number(i.idLost) === Number(item.lostID)) || {};
          const found = foundItems.find(i => Number(i.idFound) === Number(item.foundID)) || {};
          name = `${lost.itemName || "N/A"} - ${found.itemName || "N/A"}`;
          details = `Match Score: ${item.totalPoints || "N/A"}/100`;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${type.charAt(0).toUpperCase() + type.slice(1)}</td>
          <td>${name}</td>
          <td>${details}</td>
          <td>${new Date(deletedAt).toLocaleString()}</td>
          <td>
              <button class="action-button view-button" onclick="viewItem(${index}, '${type}')">View</button>
              <button class="action-button restore-button" onclick="restoreItem(${index}, '${type}')">Restore</button>
          </td>
      `;
      tbody.appendChild(row);
  });
  console.log(`Rendered ${trashbinItems.length} trash bin items`);
}

function viewItem(index, type) {
  console.log(`Viewing trash bin item at index ${index} of type ${type}`);
  const trashbinItems = JSON.parse(localStorage.getItem("trashbinItems")) || [];
  const entry = trashbinItems[index];

  if (!entry) {
      console.error(`No item found at index ${index}`);
      Swal.fire({
          title: 'Error',
          text: 'Item not found.',
          icon: 'error',
          confirmButtonText: 'OK'
      });
      return;
  }

  const { item } = entry;

  if (type === "lost") {
      viewLostItem(item);
  } else if (type === "found") {
      viewFoundItem(item);
  } else if (type === "matched") {
      viewMatchedItem(item);
  }
}

function viewLostItem(item) {
  console.log(`Displaying lost item details: ${item.itemName || "N/A"}`);
  document.getElementById("viewLostName").innerText = item.itemName || "N/A";
  document.getElementById("viewLostCategory").innerText = item.category || "N/A";
  document.getElementById("viewLostLastLocated").innerText = item.lastLocated || "N/A";
  document.getElementById("viewLostDateLost").innerText = item.dateLost || "N/A";
  document.getElementById("viewLostTimeReported").innerText = item.timeReported || "N/A";
  document.getElementById("viewLostColor").innerHTML = `<div class="color-rectangle" style="background-color: ${item.itemColor || '#ccc'};"></div>`;
  document.getElementById("viewLostDescription").innerText = item.description || "No description";
  document.getElementById("viewLostReportedBy").innerText = item.reportedBy || "N/A";
  document.getElementById("viewLostStatus").innerText = item.status || "Pending";

  const viewImage = document.getElementById("viewLostImage");
  viewImage.src = item.image || "images/default-image.png";

  document.getElementById("viewLostItemModal").style.display = "flex";
}

function viewFoundItem(item) {
  console.log(`Displaying found item details: ${item.itemName || "N/A"}`);
  document.getElementById("viewFoundName").innerText = item.itemName || "N/A";
  document.getElementById("viewFoundCategory").innerText = item.category || "N/A";
  document.getElementById("viewFoundFoundAt").innerText = item.foundAt || "N/A";
  document.getElementById("viewFoundDateFound").innerText = item.dateFound || "N/A";
  document.getElementById("viewFoundTimeReported").innerText = item.timeReported || "N/A";
  document.getElementById("viewFoundColor").innerHTML = `<div class="color-rectangle" style="background-color: ${item.itemColor || '#ccc'};"></div>`;
  document.getElementById("viewFoundDescription").innerText = item.description || "No description";
  document.getElementById("viewFoundReportedBy").innerText = item.reportedBy || "N/A";
  document.getElementById("viewFoundStatus").innerText = item.status || "Pending";

  const viewImage = document.getElementById("viewFoundImage");
  viewImage.src = item.image || "images/default-image.png";

  document.getElementById("viewFoundItemModal").style.display = "flex";
}

function viewMatchedItem(match) {
  console.log(`Displaying matched item details for Lost ID: ${match.lostID}, Found ID: ${match.foundID}`);
  const lostItems = JSON.parse(localStorage.getItem("lostItems")) || [];
  const foundItems = JSON.parse(localStorage.getItem("foundItems")) || [];
  const lost = lostItems.find(item => Number(item.idLost) === Number(match.lostID)) || {};
  const found = foundItems.find(item => Number(item.idFound) === Number(match.foundID)) || {};

  document.getElementById("viewMatchScore").innerText = `${match.totalPoints || "N/A"}/100`;
  document.getElementById("viewMatchLostName").innerText = lost.itemName || "N/A";
  document.getElementById("viewMatchLostDescription").innerText = lost.description || "No description";
  document.getElementById("viewMatchLostCategory").innerText = lost.category || "N/A";
  document.getElementById("viewMatchLostColor").innerHTML = `<div class="color-rectangle" style="background-color: ${lost.itemColor || '#ccc'};"></div>`;
  document.getElementById("viewMatchLostLocation").innerText = lost.lastLocated || "N/A";
  document.getElementById("viewMatchLostDate").innerText = lost.dateLost || "N/A";
  document.getElementById("viewMatchLostTimeReported").innerText = lost.timeReported || "N/A";
  document.getElementById("viewMatchLostReportedBy").innerText = lost.reportedBy || "N/A";
  document.getElementById("viewMatchFoundName").innerText = found.itemName || "N/A";
  document.getElementById("viewMatchFoundDescription").innerText = found.description || "No description";
  document.getElementById("viewMatchFoundCategory").innerText = found.category || "N/A";
  document.getElementById("viewMatchFoundColor").innerHTML = `<div class="color-rectangle" style="background-color: ${found.itemColor || '#ccc'};"></div>`;
  document.getElementById("viewMatchFoundLocation").innerText = found.foundAt || "N/A";
  document.getElementById("viewMatchFoundDate").innerText = found.dateFound || "N/A";
  document.getElementById("viewMatchFoundTimeReported").innerText = found.timeReported || "N/A";
  document.getElementById("viewMatchFoundReportedBy").innerText = found.reportedBy || "N/A";

  document.getElementById("viewMatchLostImage").src = lost.image || "images/default-image.png";
  document.getElementById("viewMatchFoundImage").src = found.image || "images/default-image.png";

  document.getElementById("viewMatchModal").style.display = "flex";
}

function restoreItem(index, type) {
  console.log(`Initiating restore for item at index ${index} of type ${type}`);
  Swal.fire({
      title: 'Are you sure?',
      text: `This ${type} item will be restored to its original list.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, restore it!',
      cancelButtonText: 'Cancel'
  }).then((result) => {
      if (result.isConfirmed) {
          console.log(`Confirmed restore for item at index ${index}`);
          let trashbinItems = JSON.parse(localStorage.getItem("trashbinItems")) || [];
          const entry = trashbinItems[index];

          if (!entry) {
              console.error(`No item found at index ${index}`);
              Swal.fire({
                  title: 'Error',
                  text: 'No item found to restore.',
                  icon: 'error',
                  confirmButtonText: 'OK'
              });
              return;
          }

          const { item } = entry;

          if (type === "lost") {
              let lostItems = JSON.parse(localStorage.getItem("lostItems")) || [];
              lostItems.push(item);
              localStorage.setItem("lostItems", JSON.stringify(lostItems));
              console.log(`Restored lost item: ${item.itemName || "N/A"}`);
          } else if (type === "found") {
              let foundItems = JSON.parse(localStorage.getItem("foundItems")) || [];
              foundItems.push(item);
              localStorage.setItem("foundItems", JSON.stringify(foundItems));
              console.log(`Restored found item: ${item.itemName || "N/A"}`);
          } else if (type === "matched") {
              let matchedItems = JSON.parse(localStorage.getItem("matchedItems")) || [];
              matchedItems.push(item);
              localStorage.setItem("matchedItems", JSON.stringify(matchedItems));
              console.log(`Restored matched item: Lost ID ${item.lostID}, Found ID ${item.foundID}`);
          }

          trashbinItems.splice(index, 1);
          localStorage.setItem("trashbinItems", JSON.stringify(trashbinItems));
          console.log(`Removed item from trash bin. Remaining items: ${trashbinItems.length}`);

          Swal.fire({
              title: 'Restored!',
              text: `The ${type} item has been restored.`,
              icon: 'success',
              confirmButtonText: 'OK'
          }).then(() => {
              loadTrashbinItems();
          });
      } else {
          console.log(`Restore cancelled for item at index ${index}`);
      }
  });
}

function sortTable(column) {
  console.log(`Sorting table by column ${column}`);
  const tbody = document.getElementById("trashbinItems");
  let trashbinItems = JSON.parse(localStorage.getItem("trashbinItems")) || [];
  const isAscending = tbody.dataset.sortOrder !== "asc";

  trashbinItems.sort((a, b) => {
      let aValue, bValue;

      switch (column) {
          case 0: // Type
              aValue = a.type.toLowerCase();
              bValue = b.type.toLowerCase();
              break;
          case 1: // Name
              aValue = a.type === "matched"
                  ? `${(JSON.parse(localStorage.getItem("lostItems")) || []).find(i => Number(i.idLost) === Number(a.item.lostID))?.itemName || "N/A"}`
                  : a.item.itemName || "N/A";
              bValue = b.type === "matched"
                  ? `${(JSON.parse(localStorage.getItem("lostItems")) || []).find(i => Number(i.idLost) === Number(b.item.lostID))?.itemName || "N/A"}`
                  : b.item.itemName || "N/A";
              break;
          case 2: // Details
              aValue = a.type === "lost" ? a.item.lastLocated || "N/A"
                  : a.type === "found" ? a.item.foundAt || "N/A"
                  : a.item.totalPoints || "N/A";
              bValue = b.type === "lost" ? b.item.lastLocated || "N/A"
                  : b.type === "found" ? b.item.foundAt || "N/A"
                  : b.item.totalPoints || "N/A";
              break;
          case 3: // Deleted At
              aValue = new Date(a.deletedAt);
              bValue = new Date(b.deletedAt);
              break;
          default:
              return 0;
      }

      if (typeof aValue === "string") {
          return isAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
          return isAscending ? aValue - bValue : bValue - aValue;
      }
  });

  tbody.dataset.sortOrder = isAscending ? "asc" : "desc";
  localStorage.setItem("trashbinItems", JSON.stringify(trashbinItems));
  loadTrashbinItems();
}

function previewImage(src) {
  console.log(`Previewing image: ${src}`);
  const modal = document.getElementById("imageModal");
  const img = document.getElementById("previewImg");
  img.src = src;
  modal.style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function closeImageModal() {
  document.getElementById("imageModal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("Trash bin page loaded, initializing...");
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
              title: "Are you sure?",
              text: "Do you want to log out?",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#d33",
              cancelButtonColor: "#3085d6",
              confirmButtonText: "Yes, log out",
              cancelButtonText: "Cancel"
          }).then((result) => {
              if (result.isConfirmed) {
                  console.log("Logout confirmed, proceeding...");
                  document.body.classList.add("fade-out");
                  setTimeout(function () {
                      localStorage.removeItem("loggedInAdmin");
                      document.querySelectorAll("input").forEach(input => input.value = "");
                      window.location.href = "admin-login.html";
                  }, 1000);
              } else {
                  console.log("Logout cancelled by user.");
              }
          });
      });
  }

  loadTrashbinItems();
});