"use strict";

const { useState, useEffect } = React;
const h = React.createElement;

function FinalizationApp() {
  const [posts, setPosts] = useState([]);

  const [form, setForm] = useState({
    postId: "",
    publicationDate: "",
    distributionChannel: "",
    reviewStatus: "",
    notes: ""
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jsonOutput, setJsonOutput] = useState("");
  useEffect(function () {
    const request = $.getJSON("/api/posts")
      .done(function (data) {
        if (Array.isArray(data.posts)) {
          setPosts(data.posts);
        } else {
          setMessage("Invalid posts data.");
          setIsError(true);
        }
      })
      .fail(function (xhr, status) {
        if (status !== "abort") {
          setMessage("Could not load blog posts.");
          setIsError(true);
        }
      });

    return function () {
      request.abort();
    };
  }, []);
  function handleChange(event) {
    const name = event.target.name;
    const value = event.target.value;

    setForm(function (previous) {
      return {
        ...previous,
        [name]: value
      };
    });
  }
  function validateForm() {
    if (!form.postId) {
      return "Please select a blog post.";
    }

    if (!posts.some(function (post) {
      return Number(post.id) === Number(form.postId);
    })) {
      return "Selected blog post does not exist.";
    }

    if (!form.publicationDate) {
      return "Please select a publication date.";
    }

    if (!form.distributionChannel) {
      return "Please select a distribution channel.";
    }

    if (!form.reviewStatus) {
      return "Please select a review status.";
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

    const finalization = {
      postId: Number(form.postId),
      publicationDate: form.publicationDate,
      distributionChannel: form.distributionChannel,
      reviewStatus: form.reviewStatus,
      notes: form.notes.trim()
    };

    const jsonData = JSON.stringify(
      finalization,
      null,
      2
    );

    setJsonOutput(jsonData);
    setSaving(true);
    setMessage("");
    $.ajax({
      url: "/api/finalizations",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(finalization)
    })
    .done(function () {
      setMessage("Publication preferences saved successfully!");
      setIsError(false);
    })
    .fail(function (xhr) {
      setMessage(
        xhr.responseJSON?.error ||
        "Could not save publication preferences."
      );
      setIsError(true);
    })
    .always(function () {
      setSaving(false);
    });
  }
  function selectField(label, name, choices) {
    return h("div", { className: "mb-3", key: name },
      h("label", {
        className: "form-label",
        htmlFor: name
      }, label),

      h("select", {
        id: name,
        name: name,
        className: "form-select",
        value: form[name],
        onChange: handleChange
      },
        h("option", { value: "" }, "Choose an option"),

        choices.map(function (choice) {
          return h("option", {
            key: choice.value,
            value: choice.value
          }, choice.label);
        })
      )
    );
  }
  return h("div", { className: "container my-4" },

    h("h2", null, "Finalize a Blog Post"),

    h("form", {
      onSubmit: handleSubmit,
      noValidate: true
    },
      selectField(
        "Select Blog Post",
        "postId",
        posts.map(function (post) {
          return {
            value: String(post.id),
            label: post.description
          };
        })
      ),
      h("div", { className: "mb-3" },
        h("label", {
          className: "form-label",
          htmlFor: "publicationDate"
        }, "Publication Date"),

        h("input", {
          id: "publicationDate",
          type: "date",
          name: "publicationDate",
          className: "form-control",
          value: form.publicationDate,
          onChange: handleChange
        })
      ),
      selectField(
        "Distribution Channel",
        "distributionChannel",
        [
          { value: "Website", label: "Website" },
          { value: "Newsletter", label: "Newsletter" },
          { value: "Both", label: "Both" }
        ]
      ),
      selectField(
        "Review Status",
        "reviewStatus",
        [
          { value: "Draft", label: "Draft" },
          { value: "Pending Review", label: "Pending Review" },
          { value: "Approved", label: "Approved" }
        ]
      ),

      h("div", { className: "mb-3" },
        h("label", {
          className: "form-label",
          htmlFor: "notes"
        }, "Editorial Notes"),

        h("textarea", {
          id: "notes",
          name: "notes",
          className: "form-control",
          rows: 3,
          value: form.notes,
          onChange: handleChange
        })
      ),

      h("button", {
        type: "submit",
        className: "btn file-page-btn",
        disabled: saving
      }, saving ? "Saving..." : "Finalize Post")
    ),

    message && h("div", {
      role: "status",
      className: "alert mt-3 " +
        (isError ? "alert-danger" : "alert-success")
    }, message),

      jsonOutput && h("div", { className: "mt-4" },
      h("h4", null, "Generated JSON"),

      h("pre", {
        className: "bg-light p-3 border rounded"
      }, jsonOutput)
    )
  );
}
const rootElement = document.getElementById("finalization-root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    h(FinalizationApp)
  );
}

