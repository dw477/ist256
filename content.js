"use strict";

$(document).ready(function () {
  let posts = [];
  let editingId = null;
  let saving = false;

  const form = $("#content-form");
  const idInput = $("#post-id");
  const saveButton = form.find('button[type="submit"]');
  idInput.prop("disabled", true);
  idInput.prop("required", false);
  idInput.attr("placeholder", "Assigned automatically");

  function showStatus(message, success) {
    $("#content-status")
      .text(message)
      .css("color", success ? "green" : "red");
  }
  function loadPosts() {
    $.getJSON("/api/posts")
      .done(function (data) {
        if (!data || !Array.isArray(data.posts)) {
          showStatus("Invalid post data.", false);
          return;
        }

        posts = data.posts;
        displayPosts(posts);
        showStatus(posts.length + " posts loaded.", true);
      })
      .fail(function () {
        showStatus(
          "Could not load posts from the database.",
          false
        );
      });
  }
  function displayPosts(items) {
    const tbody = $("#content-list");
    tbody.empty();

    items.forEach(function (post) {
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
        .addClass("btn btn-primary btn-sm")
        .text("Edit")
        .on("click", function () {
          editPost(post.id);
        });

      const deleteButton = $("<button>")
        .attr("type", "button")
        .addClass("btn btn-danger btn-sm ms-2")
        .text("Delete")
        .on("click", function () {
          deletePost(post.id);
        });

      $("<td>")
        .append(editButton, deleteButton)
        .appendTo(row);

      tbody.append(row);
    });
  }

  function selectExistingOption(selector, value) {
    const select = $(selector);

    if (!select.find("option").filter(function () {
      return this.value === value;
    }).length) {
      select.append(
        $("<option>").val(value).text(value)
      );
    }

    select.val(value);
  }

  function editPost(id) {
    const post = posts.find(function (item) {
      return Number(item.id) === Number(id);
    });

    if (!post) {
      showStatus("Post not found.", false);
      return;
    }

    editingId = Number(post.id);

    idInput.val(post.id);
    $("#post-title").val(post.description);

    selectExistingOption("#post-category", post.category);
    selectExistingOption("#post-type", post.format);

    $("#post-content").val(post.additionalInfo || "");

    showStatus(
      "Editing post " + post.id + ". Click Save Post.",
      true
    );

    form[0].scrollIntoView({
      behavior: "smooth"
    });
  }

  function resetForm() {
    editingId = null;
    idInput.val("");
  }

  form.on("reset", function () {
    resetForm();
  });
  form.on("submit", function (event) {
    event.preventDefault();

    if (saving) return;

    const description = $("#post-title").val().trim();
    const category = $("#post-category").val();
    const format = $("#post-type").val();
    const additionalInfo = $("#post-content").val().trim();

    if (
      !description ||
      !category ||
      !format ||
      !additionalInfo
    ) {
      showStatus(
        "Please complete all required fields.",
        false
      );
      return;
    }

    const postData = {
      description: description,
      category: category,
      format: format,
      additionalInfo: additionalInfo
    };

    const isEditing = editingId !== null;

    const url = isEditing
      ? "/api/posts/" + editingId
      : "/api/posts";

    const method = isEditing ? "PUT" : "POST";

    saving = true;
    saveButton.prop("disabled", true);

    $.ajax({
      url: url,
      method: method,
      contentType: "application/json",
      data: JSON.stringify(postData)
    })
      .done(function () {
        showStatus(
          isEditing
            ? "Post updated successfully!"
            : "Post created successfully!",
          true
        );

        form[0].reset();
        resetForm();

        loadPosts();
      })
      .fail(function (xhr) {
        showStatus(
          xhr.responseJSON?.error ||
          "Could not save the post.",
          false
        );
      })
      .always(function () {
        saving = false;
        saveButton.prop("disabled", false);
      });
  });
  function deletePost(id) {
    if (saving) return;

    if (!confirm(
      "Are you sure you want to delete this post?"
    )) {
      return;
    }

    saving = true;

    $.ajax({
      url: "/api/posts/" + id,
      method: "DELETE"
    })
      .done(function () {
        if (editingId === Number(id)) {
          form[0].reset();
          resetForm();
        }

        showStatus("Post deleted successfully!", true);
        loadPosts();
      })
      .fail(function (xhr) {
        showStatus(
          xhr.responseJSON?.error ||
          "Could not delete the post.",
          false
        );
      })
      .always(function () {
        saving = false;
      });
  }
  $("#content-search-form").on("submit", function (event) {
    event.preventDefault();

    const query = $("#content-search")
      .val()
      .toLowerCase()
      .trim();

    const results = posts.filter(function (post) {
      return (
        String(post.id).includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query) ||
        post.format.toLowerCase().includes(query)
      );
    });

    displayPosts(results);
    showStatus(results.length + " matching posts.", true);
  });

  loadPosts();
});
