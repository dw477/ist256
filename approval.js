"use strict";

(function () {
  const h = React.createElement;
  const { useState, useEffect } = React;

  function ApprovalApp() {
    const [submissions, setSubmissions] = useState([]);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    function loadSubmissions() {
      setLoading(true);

      $.ajax({
        url: "/api/submissions",
        method: "GET",
        dataType: "json"
      })
      .done(function (data) {
        if (data && Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
          setIsError(false);
        } else {
          setMessage("Invalid submission data.");
          setIsError(true);
        }
      })
      .fail(function () {
        setMessage("Could not load submissions.");
        setIsError(true);
      })
      .always(function () {
        setLoading(false);
      });
    }

    useEffect(function () {
      loadSubmissions();
    }, []);

    function updateStatus(id, status) {
      setUpdatingId(id);

      $.ajax({
        url: "/api/submissions/" + encodeURIComponent(id),
        method: "PATCH",
        contentType: "application/json",
        data: JSON.stringify({ status: status })
      })
      .done(function () {
        setMessage(
          "Submission " + status.toLowerCase() + " successfully!"
        );
        setIsError(false);
        loadSubmissions();
      })
      .fail(function (xhr) {
        setMessage(
          xhr.responseJSON?.error ||
          "Could not update submission."
        );
        setIsError(true);
      })
      .always(function () {
        setUpdatingId(null);
      });
    }

    const pending = submissions.filter(function (item) {
      return item.status === "Pending";
    });

    return h("div", { className: "mt-3" },

      message && h("div", {
        role: "status",
        className: "alert " +
          (isError ? "alert-danger" : "alert-success")
      }, message),

      h("button", {
        type: "button",
        className: "btn file-page-btn text-white mb-3",
        disabled: loading,
        onClick: loadSubmissions
      }, "Refresh Submissions"),

      loading
        ? h("p", null, "Loading submissions...")
        : pending.length === 0
          ? h("p", null, "No submissions pending review.")
          : pending.map(function (item) {

              return h("article", {
                key: item.id,
                className: "border rounded p-3 mb-3"
              },

                h("p", null,
                  h("span", {
                    className: "badge bg-warning text-dark"
                  }, "Pending Review")
                ),

                h("h2", { className: "h4" }, item.title),

                h("dl", null,
                  h("dt", null, "Author"),
                  h("dd", null, item.author),

                  h("dt", null, "Category"),
                  h("dd", null, item.category),

                  h("dt", null, "Type"),
                  h("dd", null, item.type || "Article")
                ),

                h("h3", { className: "h5" },
                  "Post Content"
                ),

                h("p", null, item.content),

                h("div", {
                  className: "d-flex flex-wrap gap-2"
                },

                  h("button", {
                    type: "button",
                    className:
                      "btn file-page-btn text-white h-auto w-auto",
                    disabled: updatingId !== null,
                    onClick: function () {
                      updateStatus(item.id, "Approved");
                    }
                  }, "Approve"),

                  h("button", {
                    type: "button",
                    className:
                      "btn evil-page-btn text-white h-auto w-auto",
                    disabled: updatingId !== null,
                    onClick: function () {
                      updateStatus(item.id, "Rejected");
                    }
                  }, "Reject")
                )
              );
            })
    );
  }

  const sample = document.querySelector(
    'article[aria-labelledby="sample-title"]'
  );

  if (!sample) {
    console.error("Approval page sample container not found.");
    return;
  }

  sample.hidden = true;

  const rootElement = document.createElement("div");
  rootElement.id = "approval-live-root";

  sample.parentNode.insertBefore(
    rootElement,
    sample.nextSibling
  );

  ReactDOM.createRoot(rootElement).render(
    h(ApprovalApp)
  );

})();
