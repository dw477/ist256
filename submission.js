"use strict";

(function () {
  const h = React.createElement;
  const { useState, useEffect } = React;

  function SubmissionStatus() {
    const [message, setMessage] = useState(
      "Complete the form to submit a post for review."
    );
    const [isError, setIsError] = useState(false);

    useEffect(function () {
      function updateStatus(event) {
        setMessage(event.detail.message);
        setIsError(event.detail.isError);
      }

      window.addEventListener("up-submission-status", updateStatus);

      return function () {
        window.removeEventListener(
          "up-submission-status",
          updateStatus
        );
      };
    }, []);

    return h("span", {
      className: isError ? "text-danger" : ""
    }, message);
  }

  function showStatus(message, isError) {
    window.dispatchEvent(new CustomEvent(
      "up-submission-status",
      {
        detail: {
          message: message,
          isError: isError
        }
      }
    ));
  }

  const form = document.querySelector(
    'form[aria-describedby="submission-status"]'
  );

  const statusElement = document.getElementById(
    "submission-status"
  );

  if (!form || !statusElement) {
    console.error("Submission HTML elements not found.");
    return;
  }

  ReactDOM.createRoot(statusElement).render(
    h(SubmissionStatus)
  );

  const submitButton = form.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = false;

  form.noValidate = true;

  let saving = false;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (saving) return;

    const author = document.getElementById(
      "author-name"
    ).value.trim();

    const title = document.getElementById(
      "post-title"
    ).value.trim();

    const category = document.getElementById(
      "post-category"
    ).value;

    const type = document.getElementById(
      "post-type"
    ).value;

    const content = document.getElementById(
      "post-content"
    ).value.trim();

    if (!author) {
      showStatus("Please enter an author name.", true);
      return;
    }

    if (!title) {
      showStatus("Please enter a post title.", true);
      return;
    }

    if (!category) {
      showStatus("Please select a category.", true);
      return;
    }

    if (!type) {
      showStatus("Please select a post type.", true);
      return;
    }

    if (!content) {
      showStatus("Please enter post content.", true);
      return;
    }

    const submission = {
      title: title,
      author: author,
      category: category,
      type: type,
      content: content
    };

    saving = true;
    submitButton.disabled = true;

    $.ajax({
      url: "/api/submissions",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(submission)
    })
    .done(function () {
      showStatus(
        "Blog post submitted successfully! Pending review.",
        false
      );

      form.reset();
    })
    .fail(function (xhr) {
      showStatus(
        xhr.responseJSON?.error ||
        "Error: Could not submit blog post.",
        true
      );
    })
    .always(function () {
      saving = false;
      submitButton.disabled = false;
    });
  });

  form.addEventListener("reset", function () {
    showStatus("Form cleared.", false);
  });

})();
