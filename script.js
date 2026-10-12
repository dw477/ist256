"use strict";

let members = [];
let editingIndex = -1;

const form = document.querySelector("#memberForm");

form.addEventListener("submit", function(event) {
   event.preventDefault();

   const fullName = document.querySelector("#fullName").value.trim();
   const email = document.querySelector("#email").value.trim();
   const phone = document.querySelector("#phone").value.trim();
   const age = document.querySelector("#age").value.trim();
   const affiliation = document.querySelector("#affiliation").value.trim();

   if (!validateForm(fullName, email, age, affiliation)) {
      return;
   }

   const member = {
      fullName,
      email,
      phone,
      age,
      affiliation
   };

   if (editingIndex === -1) {
      members.push(member);
   }
   else {
      members[editingIndex] = member;
      editingIndex = -1;
   }

   renderMembers();
   form.reset();
});

function validateForm(fullName, email, age, affiliation) {
   if (fullName === "" || email === "" || age === "" || affiliation === "") {
      alert("Please fill out all required fields.");
      return false;
   }

   const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

   if (!emailPattern.test(email)) {
      alert("Please enter a valid email address.");
      return false;
   }

   return true;
}

function renderMembers() {
   const memberList = document.querySelector("#memberList");

   memberList.innerHTML = "";

   members.forEach(function(member, index) {
      memberList.innerHTML += `
         <tr>
            <td>${member.fullName}</td>
            <td>${member.email}</td>
            <td>${member.phone}</td>
            <td>${member.age}</td>
            <td>${member.affiliation}</td>
            <td>
               <button type="button" onclick="editMember(${index})">
                  Edit
               </button>
               <button type="button" onclick="deleteMember(${index})">
                  Delete
               </button>
            </td>
         </tr>
      `;
   });
}

function editMember(index) {
   const member = members[index];

   document.querySelector("#fullName").value = member.fullName;
   document.querySelector("#email").value = member.email;
   document.querySelector("#phone").value = member.phone;
   document.querySelector("#age").value = member.age;
   document.querySelector("#affiliation").value = member.affiliation;

   editingIndex = index;
}

function deleteMember(index) {
   members.splice(index, 1);
   renderMembers();
}
