document.addEventListener("DOMContentLoaded", function () {
  const loggedInStudent = sessionStorage.getItem("loggedInStudentName");
  if (!loggedInStudent) {
      Swal.fire({
          title: 'Unauthorized Access',
          text: 'Please log in to view your reports.',
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

  // Update footer with student name
  const fullName = sessionStorage.getItem("loggedInStudentName");
  if (fullName) {
      const title = document.getElementById("nav-footer-title");
      const subtitle = document.getElementById("nav-footer-subtitle");
      if (title && subtitle) {
          title.textContent = fullName;
          subtitle.textContent = "Student";
      }
  }

  // Logout handler
  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
      logoutButton.addEventListener("click", function () {
          document.body.classList.add("fade-out");
          setTimeout(function () {
              sessionStorage.removeItem("loggedInStudentName");
              localStorage.removeItem("loggedInAdmin");
              const inputs = document.querySelectorAll("input");
              inputs.forEach(input => input.value = "");
              window.location.href = "student-login.html";
          }, 1000);
      });
  }

  // Load reports
  loadReports();
});

function loadReports() {
  const loggedInStudent = sessionStorage.getItem("loggedInStudentName");
  const lostList = document.getElementById("recentLostItems");
  const foundList = document.getElementById("recentFoundItems");
  lostList.innerHTML = "";
  foundList.innerHTML = "";

  // Load found items
  let foundItems = [];
  try {
      foundItems = JSON.parse(localStorage.getItem("foundItems")) || [];
  } catch (error) {
      console.error("Error parsing foundItems:", error);
      foundItems = [];
  }

  const studentFoundItems = foundItems.filter(i => i.reportedBy && i.reportedBy.toLowerCase() === loggedInStudent.toLowerCase());

  if (studentFoundItems.length === 0) {
      const li = document.createElement("li");
      li.className = "no-items";
      li.textContent = "No found items reported.";
      foundList.appendChild(li);
  } else {
      studentFoundItems.forEach(item => {
          const li = document.createElement("li");
          li.innerHTML = `
              <div>
                  <strong>${item.itemName}</strong> - ${item.foundAt}<br>
                  ${item.description}<br>
                  <p>Status: ${item.status}</p>
              </div>
              <div>
                  <button onclick="viewFoundItem(${item.idFound})">View</button>
                  <button onclick="editFoundItem(${item.idFound})">Edit</button>
                  <button onclick="deleteFoundItem(${item.idFound})">Delete</button>
              </div>
          `;
          foundList.appendChild(li);
      });
  }

  // Load lost items
  let lostItems = [];
  try {
      lostItems = JSON.parse(localStorage.getItem("lostItems")) || [];
  } catch (error) {
      console.error("Error parsing lostItems:", error);
      lostItems = [];
  }

  const studentLostItems = lostItems.filter(i => i.reportedBy && i.reportedBy.toLowerCase() === loggedInStudent.toLowerCase());

  if (studentLostItems.length === 0) {
      const li = document.createElement("li");
      li.className = "no-items";
      li.textContent = "No lost items reported.";
      lostList.appendChild(li);
  } else {
      studentLostItems.forEach(item => {
          const li = document.createElement("li");
          li.innerHTML = `
              <div>
                  <strong>${item.itemName}</strong> - Last located at: ${item.lastLocated}<br>
                  ${item.description}<br>
                  <p>Status: ${item.status}</p>
              </div>
              <div>
                  <button onclick="viewLostItem(${item.idLost})">View</button>
                  <button onclick="editLostItem(${item.idLost})">Edit</button>
                  <button onclick="deleteLostItem(${item.idLost})">Delete</button>
              </div>
          `;
          lostList.appendChild(li);
      });
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function viewFoundItem(id) {
  const items = JSON.parse(localStorage.getItem("foundItems")) || [];
  const item = items.find(i => i.idFound === id && i.reportedBy.toLowerCase() === sessionStorage.getItem("loggedInStudentName").toLowerCase());
  if (!item) {
      Swal.fire({
          title: 'Error',
          text: 'Item not found or access denied.',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-error'
          }
      });
      return;
  }

  document.getElementById("viewName").innerText = item.itemName || "N/A";
  document.getElementById("viewCategory").innerText = item.category || "N/A";
  document.getElementById("viewFoundAt").innerText = item.foundAt || "N/A";
  document.getElementById("viewDateFound").innerText = item.dateFound || "N/A";
  document.getElementById("viewColor").innerText = item.itemColor || "N/A";
  document.getElementById("viewDescription").innerText = item.description || "N/A";

  const viewImage = document.getElementById("viewImage");
  viewImage.src = item.image || "";
  viewImage.style.display = item.image ? "block" : "none";

  document.getElementById("viewModal").style.display = "flex";
}

function viewLostItem(id) {
  const items = JSON.parse(localStorage.getItem("lostItems")) || [];
  const item = items.find(i => i.idLost === id && i.reportedBy.toLowerCase() === sessionStorage.getItem("loggedInStudentName").toLowerCase());
  if (!item) {
      Swal.fire({
          title: 'Error',
          text: 'Item not found or access denied.',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-error'
          }
      });
      return;
  }

  document.getElementById("viewLostName").innerText = item.itemName || "N/A";
  document.getElementById("viewLostCategory").innerText = item.category || "N/A";
  document.getElementById("viewLostLastLocated").innerText = item.lastLocated || "N/A";
  document.getElementById("viewLostDateLost").innerText = item.dateLost || "N/A";
  document.getElementById("viewLostColor").innerText = item.itemColor || "N/A";
  document.getElementById("viewLostDescription").innerText = item.description || "N/A";

  const viewImage = document.getElementById("viewLostImage");
  viewImage.src = item.image || "";
  viewImage.style.display = item.image ? "block" : "none";

  document.getElementById("viewLostItemModal").style.display = "flex";
}

function editFoundItem(id) {
  const items = JSON.parse(localStorage.getItem("foundItems")) || [];
  const item = items.find(i => i.idFound === id && i.reportedBy.toLowerCase() === sessionStorage.getItem("loggedInStudentName").toLowerCase());
  if (!item) {
      Swal.fire({
          title: 'Error',
          text: 'Item not found or access denied.',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-error'
          }
      });
      return;
  }

  document.getElementById("editId").value = item.idFound;
  document.getElementById("editName").value = item.itemName || "";
  document.getElementById("editCategory").value = item.category || "";
  document.getElementById("editFoundAt").value = item.foundAt || "";
  document.getElementById("editDateFound").value = item.dateFound || "";
  document.getElementById("editColor").value = item.itemColor || "#ffffff";
  document.getElementById("editDescription").value = item.description || "";

  document.getElementById("editModal").style.display = "flex";
}

document.getElementById("editForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const id = parseInt(document.getElementById("editId").value);
  const items = JSON.parse(localStorage.getItem("foundItems")) || [];
  const itemIndex = items.findIndex(i => i.idFound === id && i.reportedBy.toLowerCase() === sessionStorage.getItem("loggedInStudentName").toLowerCase());
  if (itemIndex === -1) {
      Swal.fire({
          title: 'Error',
          text: 'Item not found or access denied.',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-error'
          }
      });
      return;
  }

  const updatedItem = {
      ...items[itemIndex],
      itemName: document.getElementById("editName").value,
      category: document.getElementById("editCategory").value,
      foundAt: document.getElementById("editFoundAt").value,
      dateFound: document.getElementById("editDateFound").value,
      itemColor: document.getElementById("editColor").value,
      description: document.getElementById("editDescription").value
  };

  const fileInput = document.getElementById("editImageInput");
  if (fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
          updatedItem.image = e.target.result;
          items[itemIndex] = updatedItem;
          localStorage.setItem("foundItems", JSON.stringify(items));
          loadReports();
          closeModal("editModal");
          Swal.fire({
              title: 'Success',
              text: 'Found item updated successfully.',
              icon: 'success',
              confirmButtonText: 'OK',
              customClass: {
                  popup: 'swal-success'
              }
          });
      };
      reader.readAsDataURL(fileInput.files[0]);
  } else {
      items[itemIndex] = updatedItem;
      localStorage.setItem("foundItems", JSON.stringify(items));
      loadReports();
      closeModal("editModal");
      Swal.fire({
          title: 'Success',
          text: 'Found item updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-success'
          }
      });
  }
});

function editLostItem(id) {
  const items = JSON.parse(localStorage.getItem("lostItems")) || [];
  const item = items.find(i => i.idLost === id && i.reportedBy.toLowerCase() === sessionStorage.getItem("loggedInStudentName").toLowerCase());
  if (!item) {
      Swal.fire({
          title: 'Error',
          text: 'Item not found or access denied.',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-error'
          }
      });
      return;
  }

  document.getElementById("editLostItemId").value = item.idLost;
  document.getElementById("editLostItemName").value = item.itemName || "";
  document.getElementById("editLostItemCategory").value = item.category || "";
  document.getElementById("editLostItemLastLocated").value = item.lastLocated || "";
  document.getElementById("editLostItemDateLost").value = item.dateLost || "";
  document.getElementById("editLostItemColor").value = item.itemColor || "#ffffff";
  document.getElementById("editLostItemDescription").value = item.description || "";

  document.getElementById("editLostItemModal").style.display = "flex";
}

document.getElementById("editLostItemForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const id = parseInt(document.getElementById("editLostItemId").value);
  const items = JSON.parse(localStorage.getItem("lostItems")) || [];
  const itemIndex = items.findIndex(i => i.idLost === id && i.reportedBy.toLowerCase() === sessionStorage.getItem("loggedInStudentName").toLowerCase());
  if (itemIndex === -1) {
      Swal.fire({
          title: 'Error',
          text: 'Item not found or access denied.',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-error'
          }
      });
      return;
  }

  const updatedItem = {
      ...items[itemIndex],
      itemName: document.getElementById("editLostItemName").value,
      category: document.getElementById("editLostItemCategory").value,
      lastLocated: document.getElementById("editLostItemLastLocated").value,
      dateLost: document.getElementById("editLostItemDateLost").value,
      itemColor: document.getElementById("editLostItemColor").value,
      description: document.getElementById("editLostItemDescription").value
  };

  const fileInput = document.getElementById("editLostItemImageInput");
  if (fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
          updatedItem.image = e.target.result;
          items[itemIndex] = updatedItem;
          localStorage.setItem("lostItems", JSON.stringify(items));
          loadReports();
          closeModal("editLostItemModal");
          Swal.fire({
              title: 'Success',
              text: 'Lost item updated successfully.',
              icon: 'success',
              confirmButtonText: 'OK',
              customClass: {
                  popup: 'swal-success'
              }
          });
      };
      reader.readAsDataURL(fileInput.files[0]);
  } else {
      items[itemIndex] = updatedItem;
      localStorage.setItem("lostItems", JSON.stringify(items));
      loadReports();
      closeModal("editLostItemModal");
      Swal.fire({
          title: 'Success',
          text: 'Lost item updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
          customClass: {
              popup: 'swal-success'
          }
      });
  }
});

function deleteFoundItem(id) {
  Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this found item? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
          popup: 'swal-error'
      }
  }).then((result) => {
      if (result.isConfirmed) {
          let items = JSON.parse(localStorage.getItem("foundItems")) || [];
          items = items.filter(i => i.idFound !== id || i.reportedBy.toLowerCase() !== sessionStorage.getItem("loggedInStudentName").toLowerCase());
          localStorage.setItem("foundItems", JSON.stringify(items));
          loadReports();
          Swal.fire({
              title: 'Deleted!',
              text: 'The found item has been deleted.',
              icon: 'success',
              confirmButtonText: 'OK',
              customClass: {
                  popup: 'swal-success'
              }
          });
      }
  });
}

function deleteLostItem(id) {
  Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this lost item? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
          popup: 'swal-error'
      }
  }).then((result) => {
      if (result.isConfirmed) {
          let items = JSON.parse(localStorage.getItem("lostItems")) || [];
          items = items.filter(i => i.idLost !== id || i.reportedBy.toLowerCase() !== sessionStorage.getItem("loggedInStudentName").toLowerCase());
          localStorage.setItem("lostItems", JSON.stringify(items));
          loadReports();
          Swal.fire({
              title: 'Deleted!',
              text: 'The lost item has been deleted.',
              icon: 'success',
              confirmButtonText: 'OK',
              customClass: {
                  popup: 'swal-success'
              }
          });
      }
  });
}