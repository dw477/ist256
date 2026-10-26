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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
