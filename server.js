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


  
// ========================================
// FINALIZATION API
// ========================================

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

// Save a new finalization
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

    // Verify blog post exists
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
