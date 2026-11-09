
"use strict";

const h = React.createElement;
const { useState } = React;

function SubmissionApp() {
  const [form, setForm] = useState({
    title: "",
    author: "",
    category: "",
    content: ""
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm(function (previous) {
      return {
        ...previous,
        [name]: value
      };
    });
  }

  function validateForm() {
    if (!form.title.trim()) {
      return "Please enter a post title.";
    }

    if (!form.author.trim()) {
      return "Please enter an author name.";
    }

    if (!form.category) {
      return "Please select a category.";
    }

    if (!form.content.trim()) {
      return "Please enter post content.";
    }

    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    const error = validateForm();

    if (error) {
      setMessage(error);
      setIsError(true);
      return;
    }

    const submission = {
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category,
      content: form.content.trim()
    };

    setSaving(true);
    setMessage("");

    $.ajax({
      url: "/api/submissions",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(submission)
    })
    .done(function () {
      setMessage("Blog post submitted for approval!");
      setIsError(false);

      setForm({
        title: "",
        author: "",
        category: "",
        content: ""
      });
    })
    .fail(function (xhr) {
      setMessage(
        xhr.responseJSON?.error ||
        "Could not submit blog post."
      );
      setIsError(true);
    })
    .always(function () {
      setSaving(false);
    });
  }

  function inputField(label, name) {
    return h("div", {
      className: "mb-3",
      key: name
    },
      h("label", {
        className: "form-label",
        htmlFor: name
      }, label),

      h("input", {
        type: "text",
        id: name,
        name: name,
        className: "form-control",
        value: form[name],
        onChange: handleChange
      })
    );
  }

  return h("div", {
    className: "container my-4"
  },

    h("h2", null, "Submit a Community Blog Post"),

    h("form", {
      onSubmit: handleSubmit,
      noValidate: true
    },

      inputField("Post Title", "title"),
      inputField("Author Name", "author"),

      h("div", { className: "mb-3" },
        h("label", {
          className: "form-label",
          htmlFor: "category"
        }, "Category"),

        h("select", {
          id: "category",
          name: "category",
          className: "form-select",
          value: form.category,
          onChange: handleChange
        },
          h("option", { value: "" }, "Choose a category"),
          h("option", { value: "Campus Life" }, "Campus Life"),
          h("option", { value: "Sports" }, "Sports"),
          h("option", { value: "Academics" }, "Academics"),
          h("option", { value: "Events" }, "Events")
        )
      ),

      h("div", { className: "mb-3" },
        h("label", {
          className: "form-label",
          htmlFor: "content"
        }, "Post Content"),

        h("textarea", {
          id: "content",
          name: "content",
          className: "form-control",
          rows: 5,
          value: form.content,
          onChange: handleChange
        })
      ),

      h("button", {
        type: "submit",
        className: "btn active-page-btn",
        disabled: saving
      }, saving ? "Submitting..." : "Submit Post")
    ),

    message && h("div", {
      role: "status",
      className: "alert mt-3 " +
        (isError ? "alert-danger" : "alert-success")
    }, message)
  );
}
const submissionRoot = document.getElementById("submission-root");

if (submissionRoot) {
  ReactDOM.createRoot(submissionRoot).render(
    h(SubmissionApp)
  );
}
