"use strict";

const { useState, useEffect } = React;

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
  const [savedJSON, setSavedJSON] = useState("");

  // Load existing posts using jQuery AJAX
  useEffect(() => {
    const request = $.getJSON("/api/posts")
      .done(function(data) {
        if (Array.isArray(data.posts)) {
          setPosts(data.posts);
        } else {
          setMessage("Invalid post data.");
          setIsError(true);
        }
      })
      .fail(function() {
        setMessage("Could not load blog posts.");
        setIsError(true);
      });

    return () => request.abort();
  }, []);

  // Update React form state
  function handleChange(event) {
    const { name, value } = event.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  // Validate required fields
  function validateForm() {
    if (!form.postId) {
      return "Please select a blog post.";
    }

    if (!posts.some(p => p.id === Number(form.postId))) {
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

  // Submit JSON to the REST API
  function handleSubmit(event) {
    event.preventDefault();

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

    setSavedJSON(jsonData);
    setSaving(true);

    // AJAX POST to backend
    $.ajax({
      url: "/api/finalizations",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(finalization)
    })
    .done(function(response) {
      setMessage(
        "Publication preferences saved successfully!"
      );
      setIsError(false);
    })
    .fail(function(xhr) {
      setMessage(
        xhr.responseJSON?.error ||
        "Could not save publication preferences."
      );
      setIsError(true);
    })
    .always(function() {
      setSaving(false);
    });
  }

  return (
    <div className="container my-4">
      <h2>Finalize a Blog Post</h2>

      <form onSubmit={handleSubmit} noValidate>

        <div className="mb-3">
          <label className="form-label">
            Select Blog Post
          </label>

          <select
            className="form-select"
            name="postId"
            value={form.postId}
            onChange={handleChange}
          >
            <option value="">Choose a post</option>

            {posts.map(post => (
              <option key={post.id} value={post.id}>
                {post.description}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">
            Publication Date
          </label>

          <input
            type="date"
            className="form-control"
            name="publicationDate"
            value={form.publicationDate}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Distribution Channel
          </label>

          <select
            className="form-select"
            name="distributionChannel"
            value={form.distributionChannel}
            onChange={handleChange}
          >
            <option value="">Choose a channel</option>
            <option value="Website">Website</option>
            <option value="Newsletter">Newsletter</option>
            <option value="Both">Both</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">
            Review Status
          </label>

          <select
            className="form-select"
            name="reviewStatus"
            value={form.reviewStatus}
            onChange={handleChange}
          >
            <option value="">Choose a status</option>
            <option value="Draft">Draft</option>
            <option value="Pending Review">
              Pending Review
            </option>
            <option value="Approved">Approved</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">
            Editorial Notes
          </label>

          <textarea
            className="form-control"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving..." : "Finalize Post"}
        </button>
      </form>

      {message && (
        <div
          role="status"
          className={
            "alert mt-3 " +
            (isError ? "alert-danger" : "alert-success")
          }
        >
          {message}
        </div>
      )}

      {savedJSON && (
        <div className="mt-4">
          <h4>Generated JSON</h4>
          <pre className="bg-light p-3 border rounded">
            {savedJSON}
          </pre>
        </div>
      )}
    </div>
  );
}

const rootElement =
  document.getElementById("finalization-root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <FinalizationApp />
  );
}
