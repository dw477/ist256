const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = 3000;
const postsFile = path.join(__dirname, "posts.json");

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/posts", async (req, res) => {
  try {
    const data = await fs.readFile(postsFile, "utf8");
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: "Could not read posts." });
  }
});
app.post("/api/posts", async (req, res) => {
  try {
    const posts = req.body.posts;

    if (!Array.isArray(posts) || !posts.every(post =>
      Number.isInteger(post.id) &&
      post.id > 0 &&
      typeof post.description === "string" &&
      post.description.trim() &&
      typeof post.category === "string" &&
      post.category.trim() &&
      typeof post.format === "string" &&
      post.format.trim() &&
      typeof post.price === "number" &&
      post.price >= 0
    )) {
      return res.status(400).json({
        error: "Invalid post data."
      });
    }

    await fs.writeFile(
      postsFile,
      JSON.stringify({ posts }, null, 2),
      "utf8"
    );

    res.json({ message: "posts.json updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Could not save posts." });
  }
});


const finalizationsFile = path.join(
  __dirname,
  "finalizations.json"
);

// Get saved finalizations
app.get("/api/finalizations", async (req, res) => {
  try {
    const data = await fs.readFile(
      finalizationsFile,
      "utf8"
    );

    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({
      error: "Could not load finalizations."
    });
  }
});

app.post("/api/finalizations", async (req, res) => {
  try {
    const {
      postId,
      publicationDate,
      distributionChannel,
      reviewStatus,
      notes = ""
    } = req.body || {};

    if (
      !Number.isInteger(postId) ||
      postId <= 0 ||
      typeof publicationDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(publicationDate) ||
      !["Website", "Newsletter", "Both"].includes(
        distributionChannel
      ) ||
      !["Draft", "Pending Review", "Approved"].includes(
        reviewStatus
      ) ||
      typeof notes !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid publication preferences."
      });
    }

    const postsData = JSON.parse(
      await fs.readFile(postsFile, "utf8")
    );

    if (!postsData.posts.some(p => p.id === postId)) {
      return res.status(400).json({
        error: "Blog post not found."
      });
    }

    const data = JSON.parse(
      await fs.readFile(finalizationsFile, "utf8")
    );

    if (!Array.isArray(data.finalizations)) {
      throw new Error("Invalid finalizations file");
    }

    const finalization = {
      id: data.finalizations.reduce(
        (max, item) => Math.max(max, item.id || 0),
        0
      ) + 1,
      postId,
      publicationDate,
      distributionChannel,
      reviewStatus,
      notes
    };

    data.finalizations.push(finalization);

    await fs.writeFile(
      finalizationsFile,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    res.status(201).json({
      message: "Finalization saved successfully!",
      finalization
    });

  } catch (error) {
    res.status(500).json({
      error: "Could not save finalization."
    });
  }
});

const submissionsFile = path.join(
  __dirname,
  "submissions.json"
);

async function readSubmissions() {
  const fileData = await fs.readFile(
    submissionsFile,
    "utf8"
  );

  const data = JSON.parse(fileData);

  if (!Array.isArray(data.submissions)) {
    throw new Error("Invalid submissions.json data.");
  }

  return data;
}

async function writeSubmissions(data) {
  await fs.writeFile(
    submissionsFile,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

app.get("/api/submissions", async (req, res) => {
  try {
    const data = await readSubmissions();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Could not load submissions."
    });
  }
});

app.post("/api/submissions", async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      content
    } = req.body || {};

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof author !== "string" ||
      !author.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        error: "All required submission fields must be completed."
      });
    }

    const data = await readSubmissions();

    const nextId = data.submissions.reduce(
      (max, item) => Math.max(max, item.id || 0),
      0
    ) + 1;

    const newSubmission = {
      id: nextId,
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      content: content.trim(),
      status: "Pending",
      reviewNotes: "",
      submittedAt: new Date().toISOString()
    };

    data.submissions.push(newSubmission);

    await writeSubmissions(data);

    res.status(201).json({
      message: "Blog post submitted for approval!",
      submission: newSubmission
    });

  } catch (error) {
    res.status(500).json({
      error: "Could not save submission."
    });
  }
});

app.patch("/api/submissions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !["Approved", "Rejected"].includes(status)
    ) {
      return res.status(400).json({
        error: "Invalid submission ID or status."
      });
    }

    const data = await readSubmissions();

    const submission = data.submissions.find(
      item => item.id === id
    );

    if (!submission) {
      return res.status(404).json({
        error: "Submission not found."
      });
    }

    if (submission.status !== "Pending") {
      return res.status(409).json({
        error: "This submission has already been reviewed."
      });
    }

    submission.status = status;
    submission.reviewedAt = new Date().toISOString();

    await writeSubmissions(data);

    res.json({
      message: "Submission " + status.toLowerCase() + " successfully!",
      submission: submission
    });

  } catch (error) {
    res.status(500).json({
      error: "Could not update submission."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
