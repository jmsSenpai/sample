function toggleMenu() {
  let sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("collapsed");
}

document.addEventListener("DOMContentLoaded", loadStudentAccounts);

function loadStudentAccounts() {
  const studentAccountsContainer = document.getElementById('student-accounts');
  studentAccountsContainer.innerHTML = '';

  for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const studentData = JSON.parse(localStorage.getItem(key));

     
      if (studentData && studentData.accountType === 'student') { 
          const row = document.createElement('div');
          row.className = 'table-row';
          row.setAttribute('data-email', key);

          row.innerHTML = `
              <div class="row-item">${studentData.firstName} ${studentData.middleName ? studentData.middleName + ' ' : ''}${studentData.lastName}</div>
              <div class="row-item">${studentData.gradeSection}</div>
              <div class="row-item">${key}</div>
              <div class="row-item actions">
                  ${studentData.accepted ? '' : '<button class="accept-btn">Accept</button>'}
                  <button class="delete-btn">Delete</button>
                  <button class="details-btn">See More Details</button>
              </div>
          `;

          studentAccountsContainer.appendChild(row);
      }
  }


const acceptButtons = document.querySelectorAll('.accept-btn');
const deleteButtons = document.querySelectorAll('.delete-btn');
const detailsButtons = document.querySelectorAll('.details-btn');


acceptButtons.forEach(button => {
  button.addEventListener('click', function () {
      const row = this.closest('.table-row');
      const email = row.getAttribute('data-email');

      const studentData = JSON.parse(localStorage.getItem(email));
      if (studentData) {
          studentData.accepted = true;
          localStorage.setItem(email, JSON.stringify(studentData));

          
          fetch('/accept-student', { 
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  studentEmail: email,
                  studentName: `${studentData.firstName} ${studentData.lastName}`
              })
          })
          .then(response => response.json())
          .then(data => {
              alert(`${studentData.firstName} ${studentData.lastName} has been accepted.`);
              loadStudentAccounts();  
          })
          .catch(error => {
              console.error('Error:', error);
              alert('Failed to send acceptance email.');
          });
      }
  });
});



function sendEmailToStudent(studentEmail, studentName) {
  fetch('/send-acceptance-email', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          email: studentEmail,
          name: studentName,
      }),
  })
  .then(response => response.json())
  .then(data => {
      console.log('Email sent successfully:', data);
  })
  .catch(error => {
      console.error('Error sending email:', error);
  });
}

deleteButtons.forEach(button => {
button.addEventListener('click', function () {
  const row = this.closest('.table-row');
  const email = row.getAttribute('data-email');

  localStorage.removeItem(email); 
  alert(`Student account with email ${email} has been deleted.`);
  loadStudentAccounts();
});
});

detailsButtons.forEach(button => {
button.addEventListener('click', function () {
  const row = this.closest('.table-row');
  const email = row.getAttribute('data-email');

  const studentData = JSON.parse(localStorage.getItem(email));
  if (studentData) {
      showModal(studentData); 
  }
});
});
}

function showModal(studentData) {
  const modal = document.getElementById('student-modal');
  const modalContent = document.getElementById('modal-content');

  modalContent.innerHTML = `
      <h2>Student Details</h2>
      <p><strong>Name:</strong> ${studentData.firstName} ${studentData.middleName ? studentData.middleName + ' ' : ''}${studentData.lastName}</p>
      <p><strong>Email:</strong> ${studentData.email}</p>
      <p><strong>Grade Section:</strong> ${studentData.gradeSection}</p>
      <p><strong>Other Info:</strong> ${studentData.otherInfo || 'N/A'}</p>
      ${studentData.idImage ? `<p><strong>Student ID:</strong><br><img src="${studentData.idImage}" alt="Student ID" style="max-width: 300px; border: 1px solid #ccc; margin-top: 10px;"></p>` : ''}
      <button id="close-modal">Close</button>
  `;

  modal.style.display = 'block';

  document.getElementById('close-modal').addEventListener('click', function () {
      modal.style.display = 'none';
  });
}
