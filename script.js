"use strict";

const helloButton = document.querySelector("#hello-button");
const message = document.querySelector("#message");

if (helloButton && message) {
   helloButton.addEventListener("click", () => {
      message.textContent = "Hello from JavaScript!";
   });
}

let members = JSON.parse(localStorage.getItem("members")) || [];

function addMember(name, email, phone, year, affiliation) {
   const member = {
      name: name,
      email: email,
      phone: phone,
      year: year,
      affiliation: affiliation
   };

   members.push(member);
   localStorage.setItem("members", JSON.stringify(members));

   console.log("Member added:", member);
}

function displayMembers() {
   console.log("Community Members:");

   members.forEach(function(member) {
      console.log(member);
   });
}

let posts = JSON.parse(localStorage.getItem("posts")) || [];

async function loadPosts() {
   if (localStorage.getItem("posts") !== null) {
      return;
   }

   try {
      const response = await fetch("posts.json");

      if (!response.ok) {
         throw new Error("Could not load posts.json");
      }

      const data = await response.json();
      posts = data.posts;

      localStorage.setItem("posts", JSON.stringify(posts));
      displayPosts();
   } catch (error) {
      console.log("Error loading posts:", error);
   }
}

function addPost(id, description, category, format, value, additionalInfo) {
   const post = {
      id: Number(id),
      description: description,
      category: category,
      format: format,
      value: Number(value),
      additionalInfo: additionalInfo
   };

   posts.push(post);
   localStorage.setItem("posts", JSON.stringify(posts));

   console.log("Post added:", post);
   displayPosts();
}

function updatePost(id, description, category, format, value, additionalInfo) {
   const post = posts.find(function(post) {
      return post.id === Number(id);
   });

   if (post) {
      post.description = description;
      post.category = category;
      post.format = format;
      post.value = Number(value);
      post.additionalInfo = additionalInfo;

      localStorage.setItem("posts", JSON.stringify(posts));
      console.log("Post updated:", post);
      displayPosts();
   }
}

function displayPosts() {
   console.log("Community Blog Posts:");

   posts.forEach(function(post) {
      console.log(post);
   });
}

function downloadJSON(data, filename) {
   const json = JSON.stringify(data, null, 2);

   const blob = new Blob([json], {
      type: "application/json"
   });

   const url = URL.createObjectURL(blob);
   const link = document.createElement("a");

   link.href = url;
   link.download = filename;

   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);

   setTimeout(function() {
      URL.revokeObjectURL(url);
   }, 1000);
}

function downloadMembers() {
   downloadJSON({ members: members }, "members.json");
}

function downloadPosts() {
   downloadJSON({ posts: posts }, "posts.json");
}

loadPosts();
displayMembers();

