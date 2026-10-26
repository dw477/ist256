"use strict";

$(document).ready(function () {
  let posts = [];

  function showStatus(message, success) {
    $("#content-status")
      .text(message)
      .css("color", success ? "green" : "red");
  }

  function loadPosts() {
    $.getJSON("/api/posts", function (data) {
      if (!Array.isArray(data.posts)) {
        showStatus("Invalid posts data.", false);
        return;
      }

      posts = data.posts;
      displayPosts(posts);
    }).fail(function () {
      showStatus("Could not load posts from the API.", false);
    });
  }

  function displayPosts(items) {
    const tbody = $("#content-list");
    tbody.empty();

    items.forEach(function (post) {
      const row = $("<tr>");

      $("<th>").attr("scope", "row")
        .text(post.id).appendTo(row);

      $("<td>").text(post.description).appendTo(row);
      $("<td>").text(post.category).appendTo(row);
      $("<td>").text(post.format).appendTo(row);
      $("<td>").text(post.additionalInfo || "").appendTo(row);

      const editButton = $("<button>")
        .attr("type", "button")
        .addClass("btn btn-primary btn-sm")
        .text("Edit")
        .on("click", function () {
          editPost(post.id);
        });

      $("<td>").append(editButton).appendTo(row);
      tbody.append(row);
    });
  }

  function editPost(id) {
    const post = posts.find(function (p) {
      return p.id === id;
    });

    if (!post) return;

    $("#post-id").val(post.id);
    $("#post-title").val(post.description);
    $("#post-category").val(post.category);
    $("#post-type").val(post.format);
    $("#post-content").val(post.additionalInfo || "");

    showStatus("Editing post " + id, true);
  }

  $("#content-form").on("submit", function (event) {
    event.preventDefault();

    const idText = $("#post-id").val().trim();
    const id = Number(idText);
    const title = $("#post-title").val().trim();
    const category = $("#post-category").val();
    const type = $("#post-type").val();
    const content = $("#post-content").val().trim();

    if (
      idText === "" ||
      !Number.isInteger(id) ||
      id <= 0 ||
      !title ||
      !category ||
      !type ||
      !content
    ) {
      showStatus("Please complete all required fields.", false);
      return;
    }

    const index = posts.findIndex(function (p) {
      return p.id === id;
    });

    const previousPosts = posts.map(function (p) {
      return { ...p };
    });

    const post = {
      id: id,
      description: title,
      category: category,
      format: type,
      value: index >= 0 ? posts[index].value : 5,
      price: index >= 0 ? (posts[index].price ?? 0) : 0,
      additionalInfo: content
    };

    if (index >= 0) {
      posts[index] = post;
    } else {
      posts.push(post);
    }

    $.ajax({
      url: "/api/posts",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ posts: posts })
    }).done(function () {
      displayPosts(posts);
      $("#content-form")[0].reset();
      showStatus("Post saved successfully!", true);
    }).fail(function () {
      posts = previousPosts;
      showStatus("Could not save post to posts.json.", false);
    });
  });

  $("#content-search-form").on("submit", function (event) {
    event.preventDefault();

    const query = $("#content-search").val()
      .toLowerCase().trim();

    const results = posts.filter(function (post) {
      return (
        String(post.id).includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query)
      );
    });

    displayPosts(results);
    showStatus(results.length + " matching posts found.", true);
  });

  loadPosts();
});
