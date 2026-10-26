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
  function showMessage(text, color) {
    $("#content-status").text(text).css("color", color);
  }

  function loadPosts() {
    $.getJSON("/api/posts", function (data) {
      if (!data || !Array.isArray(data.posts)) {
        showMessage("Invalid posts data.", "red");
        return;
      }

      posts = data.posts;
      displayPosts(posts);

    }).fail(function () {
      showMessage("Error loading posts.json from server.", "red");
    });
  }

  function savePosts(updatedPosts) {
    return $.ajax({
      url: "/api/posts",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        posts: updatedPosts
      })
    });
  }

  function displayPosts(postList) {
    $("#content-list").empty();

    postList.forEach(function (post) {
      const row = $("<tr>");

      $("<th>")
        .attr("scope", "row")
        .text(post.id)
        .appendTo(row);

      $("<td>").text(post.description).appendTo(row);
      $("<td>").text(post.category).appendTo(row);
      $("<td>").text(post.format).appendTo(row);
      $("<td>").text(post.additionalInfo || "").appendTo(row);

      const editButton = $("<button>")
        .attr("type", "button")
        .text("Edit")
        .addClass("btn btn-primary btn-sm")
        .on("click", function () {
          editPost(post.id);
        });
      
      const deleteButton = $("<button>")
        .attr("type", "button")
        .text("Delete")
        .addClass("btn btn-danger btn-sm ms-2")
        .on("click", function () {
          deletePost(post.id);
        });

      $("<td>")
        .append(editButton, deleteButton)
        .appendTo(row);

      $("#content-list").append(row);
    });
  }

  $("#content-form").on("submit", function (event) {
    event.preventDefault();
    const idText = $("#post-id").val().trim();
    const id = Number(idText);

    const description = $("#post-title").val().trim();
    const category = $("#post-category").val();
    const format = $("#post-type").val();
    const additionalInfo = $("#post-content").val().trim();

    if (
      idText === "" ||
      !Number.isInteger(id) ||
      id <= 0 ||
      description === "" ||
      !category ||
      !format ||
      additionalInfo === ""
    ) {
      showMessage(
        "Error: Please complete all required fields correctly.",
        "red"
      );
      return;
    }
    const existingIndex = posts.findIndex(function (post) {
      return Number(post.id) === id;
    });

    const existingPost =
      existingIndex >= 0 ? posts[existingIndex] : null;
    const newPost = {
      id: id,
      description: description,
      category: category,
      format: format,
      value: existingPost ? existingPost.value : 5,
      price: existingPost ? (existingPost.price ?? 0) : 0,

      additionalInfo: additionalInfo
    };
    const updatedPosts = posts.slice();

    if (existingIndex === -1) {
      updatedPosts.push(newPost);
    } else {
      updatedPosts[existingIndex] = newPost;
    }
    savePosts(updatedPosts)
      .done(function () {
        posts = updatedPosts;

        displayPosts(posts);

        $("#content-form")[0].reset();

        if (existingIndex === -1) {
          showMessage("Post added successfully!", "green");
        } else {
          showMessage("Post updated successfully!", "green");
        }
      })
      .fail(function (xhr) {
        showMessage(
          "Error: Could not save post to posts.json. " +
          (xhr.responseJSON?.error || ""),
          "red"
        );
      });
  });
  function editPost(id) {
    const post = posts.find(function (item) {
      return Number(item.id) === id;
    });

    if (!post) {
      showMessage("Post not found.", "red");
      return;
    }

    $("#post-id").val(post.id);
    $("#post-title").val(post.description);
    if (
      $("#post-category option").filter(function () {
        return this.value === post.category;
      }).length === 0
    ) {
      $("#post-category").append(
        $("<option>").val(post.category).text(post.category)
      );
    }

    $("#post-category").val(post.category);
    if (
      $("#post-type option").filter(function () {
        return this.value === post.format;
      }).length === 0
    ) {
      $("#post-type").append(
        $("<option>").val(post.format).text(post.format)
      );
    }

    $("#post-type").val(post.format);
    $("#post-content").val(post.additionalInfo || "");

    showMessage(
      "Editing post " + id + ". Make changes and click Save Post.",
      "blue"
    );

    document.querySelector("#content-form").scrollIntoView({
      behavior: "smooth"
    });
  }
  function deletePost(id) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmDelete) {
      return;
    }

    const updatedPosts = posts.filter(function (post) {
      return Number(post.id) !== id;
    });

    savePosts(updatedPosts)
      .done(function () {
        posts = updatedPosts;
        displayPosts(posts);

        showMessage("Post deleted successfully!", "green");
      })
      .fail(function () {
        showMessage(
          "Error: Could not delete post from posts.json.",
          "red"
        );
      });
  }
  function searchPosts() {
    const searchText = $("#content-search")
      .val()
      .toLowerCase()
      .trim();

    const filteredPosts = posts.filter(function (post) {
      return (
        String(post.id).includes(searchText) ||
        post.description.toLowerCase().includes(searchText) ||
        post.category.toLowerCase().includes(searchText) ||
        post.format.toLowerCase().includes(searchText)
      );
    });

    displayPosts(filteredPosts);
  }
  $("#content-search").on("input", function () {
    searchPosts();
  });
  $("#content-search-form").on("submit", function (event) {
    event.preventDefault();
    searchPosts();
  });
  if ($("#content-list").length > 0) {
    loadPosts();
  }

});
