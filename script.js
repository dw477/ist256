"use strict";

$(document).ready(function () {

  const helloButton = document.querySelector("#hello-button");
  const helloMessage = document.querySelector("#message");

  if (helloButton && helloMessage) {
    helloButton.addEventListener("click", function () {
      helloMessage.textContent = "Hello from JavaScript!";
    });
  }

  let posts = [];

  
function loadPosts() {
  $.getJSON("/api/posts", function (data) {
    posts = data.posts;
    displayPosts(posts);
  }).fail(function () {
    showMessage("Error loading posts.json.", "red");
  });
}

  
function savePosts() {
  return $.ajax({
    url: "/api/posts",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ posts: posts }),

    success: function () {
      showMessage("posts.json updated successfully!", "green");
    },

    error: function () {
      showMessage("Error saving posts.json.", "red");
    }
  });
}
  function showMessage(text, color) {
    $("#message").text(text).css("color", color);
  }

  function displayPosts(postList) {
    $("#postsTable").empty();

    postList.forEach(function (post) {

      const row = $("<tr>");

      $("<td>").text(post.id).appendTo(row);
      $("<td>").text(post.description).appendTo(row);
      $("<td>").text(post.category).appendTo(row);
      $("<td>").text(post.format).appendTo(row);
      $("<td>").text(post.value).appendTo(row);
      $("<td>").text(post.additionalInfo || "").appendTo(row);

      const editButton = $("<button>")
        .text("Edit")
        .addClass("btn btn-primary btn-sm")
        .on("click", function () {
          editPost(post.id);
        });
      const deleteButton = $("<button>")
        .text("Delete")
        .addClass("btn btn-danger btn-sm ms-2")
        .on("click", function () {
          deletePost(post.id);
        });

      $("<td>")
        .append(editButton, deleteButton)
        .appendTo(row);

      $("#postsTable").append(row);
    });
  }

  $("#postForm").on("submit", function (event) {
    event.preventDefault();
    const idText = $("#postId").val().trim();
    const id = Number(idText);

    const description = $("#postDescription").val().trim();
    const category = $("#postCategory").val();
    const format = $("#postFormat").val();

    const valueText = $("#postValue").val().trim();
    const value = Number(valueText);

    const additionalInfo = $("#postAdditionalInfo").val().trim();
     
    if (
      idText === "" ||
      !Number.isInteger(id) ||
      id <= 0 ||
      description === "" ||
      !category ||
      !format ||
      valueText === "" ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      showMessage(
        "Error: Please fill out all required fields correctly.",
        "red"
      );
      return;
    }
    const newPost = {
      id: id,
      description: description,
      category: category,
      format: format,
      value: value,
      additionalInfo: additionalInfo
    };

    const existingIndex = posts.findIndex(function (post) {
      return post.id === id;
    });

    if (existingIndex === -1) {
      posts.push(newPost);

      showMessage(
        "Post added successfully!",
        "green"
      );

    } else {
      posts[existingIndex] = newPost;

      showMessage(
        "Post updated successfully!",
        "green"
      );
    }

    savePosts();
    displayPosts(posts);
    $("#postForm")[0].reset();

  });

  function editPost(id) {

    const post = posts.find(function (item) {
      return item.id === id;
    });

    if (post) {

      $("#postId").val(post.id);
      $("#postDescription").val(post.description);
      $("#postCategory").val(post.category);
      $("#postFormat").val(post.format);
      $("#postValue").val(post.value);
      $("#postAdditionalInfo").val(post.additionalInfo);

      showMessage(
        "Editing post " + id + ". Make changes and submit.",
        "blue"
      );

      document.querySelector("#postForm").scrollIntoView({
        behavior: "smooth"
      });
    }
  }

  function deletePost(id) {

    const confirmDelete = confirm(
      "Are you sure you want to delete this post?"
    );

    if (confirmDelete) {

      posts = posts.filter(function (post) {
        return post.id !== id;
      });

      savePosts();
      displayPosts(posts);

      showMessage(
        "Post deleted successfully!",
        "green"
      );
    }
  }

  $("#searchInput").on("input", function () {

    const searchText = $(this).val().toLowerCase().trim();

    const filteredPosts = posts.filter(function (post) {

      return (
        String(post.id).includes(searchText) ||
        post.description.toLowerCase().includes(searchText) ||
        post.category.toLowerCase().includes(searchText) ||
        post.format.toLowerCase().includes(searchText)
      );
    });

    displayPosts(filteredPosts);
  });
   
  if ($("#postsTable").length > 0) {
    loadPosts();
  }

});
