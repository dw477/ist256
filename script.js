"use strict";

const helloButton = document.querySelector("#hello-button");
const message = document.querySelector("#message");

helloButton.addEventListener("click", () => {
   message.textContent = "Hello from JavaScript!";
});
const members = [];
function addMember(name, email, phone, year, affiliation) {
   const member = {
      name: name,
      email: email,
      phone: phone,
      year: year,
      affiliation: affiliation
   };
   
   members.push(member);
   console.log("Member added:", member);
}
function displayMembers() {
   console.log("Community Members:");
   members.forEach(function(member) {
      console.log(member);
   });
}
addMember(
   "Roy Agarwal",
   "rza5575@psu.edu",
   "571-206-9348",
   "Junior",
   "College of IST"
);
displayMembers();
