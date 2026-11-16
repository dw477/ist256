"use strict";

$(document).ready(function () {
  const root = $("#preferences-manager");
  if (!root.length) return;

  let preferences = [];
  let editingId = null;
  let busy = false;

  root.append(`
    <section class="container my-4">
      <h2>Community Reading Preferences</h2>
      <p>Choose the Penn State blog content you prefer.</p>

      <form id="reading-preferences-form" novalidate>
        <div class="mb-3">
          <label for="pref-user" class="form-label">
            User ID
          </label>
          <input id="pref-user" type="number"
            min="1" step="1" class="form-control" required>
        </div>

        <div class="mb-3">
          <label for="pref-category" class="form-label">
            Preferred Category
          </label>
          <select id="pref-category" class="form-select" required>
            <option value="">Choose a category</option>
            <option value="Sports">Sports</option>
            <option value="Academics">Academics</option>
            <option value="Campus Life">Campus Life</option>
            <option value="Events">Events</option>
          </select>
        </div>

        <div class="mb-3">
          <label for="pref-type" class="form-label">
            Preferred Post Type
          </label>
          <select id="pref-type" class="form-select" required>
            <option value="">Choose a type</option>
            <option value="Article">Article</option>
            <option value="Guide">Guide</option>
            <option value="Announcement">Announcement</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary">
          Save Preference
        </button>
        <button type="reset" class="btn btn-secondary">
          Clear
        </button>
      </form>

      <p id="preferences-status"
        role="status" aria-live="polite"
        class="mt-3"></p>

      <h3 class="h5 mt-4">Saved Preferences</h3>
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Category</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="preferences-list"></tbody>
        </table>
      </div>
    </section>
  `);

  function showMessage(message, success) {
    $("#preferences-status")
      .text(message)
      .css("color", success ? "green" : "red");
  }

  function clearForm() {
    editingId = null;
    $("#reading-preferences-form")[0].reset();
  }

  function ensureOption(selector, value) {
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
  function loadPreferences() {
    $.getJSON("/api/preferences")
      .done(function (data) {
        if (!data || !Array.isArray(data.preferences)) {
          showMessage("Invalid preference data.", false);
          return;
        }

        preferences = data.preferences;
        displayPreferences();
      })
      .fail(function () {
        showMessage("Could not load preferences.", false);
      });
  }

  function displayPreferences() {
    const tbody = $("#preferences-list");
    tbody.empty();

    preferences.forEach(function (pref) {
      const row = $("<tr>");

      $("<td>").text(pref.preference_id).appendTo(row);
      $("<td>").text(pref.user_id).appendTo(row);
      $("<td>").text(pref.category).appendTo(row);
      $("<td>").text(pref.type).appendTo(row);

      const edit = $("<button>")
        .attr("type", "button")
        .addClass("btn btn-primary btn-sm me-2")
        .text("Edit")
        .on("click", function () {
          editingId = pref.preference_id;
          $("#pref-user").val(pref.user_id);
          ensureOption("#pref-category", pref.category);
          ensureOption("#pref-type", pref.type);
          showMessage("Editing preference.", true);
        });

      const remove = $("<button>")
        .attr("type", "button")
        .addClass("btn btn-danger btn-sm")
        .text("Delete")
        .on("click", function () {
          deletePreference(pref.preference_id);
        });

      $("<td>").append(edit, remove).appendTo(row);
      tbody.append(row);
    });
  }
  $("#reading-preferences-form").on("submit", function (e) {
    e.preventDefault();
    if (busy) return;

    const userId = Number($("#pref-user").val());
    const category = $("#pref-category").val();
    const type = $("#pref-type").val();

    if (!Number.isSafeInteger(userId) ||
        userId <= 0 || !category || !type) {
      showMessage("Complete all required fields.", false);
      return;
    }

    const data = {
      user_id: userId,
      category: category,
      type: type
    };

    const isEditing = editingId !== null;
    busy = true;

    $.ajax({
      url: isEditing
        ? "/api/preferences/" + editingId
        : "/api/preferences",
      method: isEditing ? "PUT" : "POST",
      contentType: "application/json",
      data: JSON.stringify(data)
    })
      .done(function () {
        clearForm();
        loadPreferences();
        showMessage("Preference saved successfully!", true);
      })
      .fail(function (xhr) {
        showMessage(
          xhr.responseJSON?.error ||
          "Could not save preference.",
          false
        );
      })
      .always(function () {
        busy = false;
      });
  });

  // DELETE
  function deletePreference(id) {
    if (busy || !confirm("Delete this preference?")) return;
    busy = true;

    $.ajax({
      url: "/api/preferences/" + id,
      method: "DELETE"
    })
      .done(function () {
        if (editingId === id) clearForm();
        loadPreferences();
        showMessage("Preference deleted.", true);
      })
      .fail(function () {
        showMessage("Could not delete preference.", false);
      })
      .always(function () {
        busy = false;
      });
  }

  $("#reading-preferences-form").on("reset", function () {
    editingId = null;
  });

  loadPreferences();
});
