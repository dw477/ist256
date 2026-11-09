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
          setMessage("Submission " + status.toLowerCase() + " successfully!");
          setIsError(false);
          loadSubmissions();
        })
        .fail(function (xhr) {
          setMessage(
            xhr.responseJSON?.error || "Could not update submission."
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

    return h("div", { className: "container my-4" },
      h("h2", null, "Review Community Blog Submissions"),

      h("p", null, "Approve or reject posts submitted to UP Community."),

      message && h("div", {
        className: "alert " + (isError ? "alert-danger" : "alert-success"),
        role: "status"
      }, message),

      h("button", {
        type: "button",
        className: "btn btn-outline-primary mb-3",
        onClick: loadSubmissions,
        disabled: loading
      }, "Refresh Submissions"),

      loading
        ? h("p", null, "Loading submissions...")
        : pending.length === 0
          ? h("p", null, "No submissions pending review.")
          : h("div", { className: "row g-3" },
              pending.map(function (item) {
                return h("div", {
                  className: "col-md-6",
                  key: item.id
                },
                  h("div", { className: "card h-100" },
                    h("div", { className: "card-body" },
                      h("h5", { className: "card-title" }, item.title),
                      h("p", null, "Author: " + item.author),
                      h("p", null, "Category: " + item.category),
                      h("p", { className: "card-text" }, item.content),
                      h("p", null, "Status: " + item.status),

                      h("button", {
                        type: "button",
                        className: "btn btn-success me-2",
                        disabled: updatingId !== null,
                        onClick: function () {
                          updateStatus(item.id, "Approved");
                        }
                      }, "Approve"),

                      h("button", {
                        type: "button",
                        className: "btn btn-danger",
                        disabled: updatingId !== null,
                        onClick: function () {
                          updateStatus(item.id, "Rejected");
                        }
                      }, "Reject")
                    )
                  )
                );
              })
            )
    );
  }

  const approvalRoot = document.getElementById("approval-root");

  if (approvalRoot) {
    ReactDOM.createRoot(approvalRoot).render(h(ApprovalApp));
  }
})();
