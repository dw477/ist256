const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const Database = require("better-sqlite3");

const db = new Database(
  path.join(__dirname, "blog.db")
);

db.pragma("foreign_keys = ON");

console.log("SQLite database connected successfully!");


const app = express();
const PORT = 3000;
const postsFile = path.join(__dirname, "posts.json");

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/posts", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        post_id,
        title,
        category,
        type,
        content
      FROM posts
      ORDER BY post_id
    `).all();

    const posts = rows.map(function (post) {
      return {
        id: post.post_id,
        description: post.title,
        category: post.category,
        format: post.type,
        additionalInfo: post.content,
        value: 5,
        price: 0
      };
    });

    res.json({ posts: posts });

  } catch (error) {
    console.error("SQLite read error:", error.message);

    res.status(500).json({
      error: "Could not retrieve posts from SQLite."
    });
  }
});


 // ========================================
 // SQLITE POSTS CRUD API
 // ========================================

// Convert SQLite columns to frontend fields
function formatPost(row) {
  return {
    id: row.post_id,
    description: row.title,
    category: row.category,
    format: row.type,
    additionalInfo: row.content,
    value: 5,
    price: 0
  };
}

// READ - Get all posts
app.get("/api/posts", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT post_id, title, category, type, content
      FROM posts
      ORDER BY post_id
    `).all();

    res.json({
      posts: rows.map(formatPost)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not retrieve posts."
    });
  }
});

// CREATE - Add a new post
app.post("/api/posts", (req, res) => {
  try {
    const {
      description,
      category,
      format,
      additionalInfo
    } = req.body || {};

    if (
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof format !== "string" ||
      !format.trim() ||
      typeof additionalInfo !== "string" ||
      !additionalInfo.trim()
    ) {
      return res.status(400).json({
        error: "All post fields are required."
      });
    }

    const result = db.prepare(`
      INSERT INTO posts
      (title, category, type, content)
      VALUES (?, ?, ?, ?)
    `).run(
      description.trim(),
      category.trim(),
      format.trim(),
      additionalInfo.trim()
    );

    const row = db.prepare(`
      SELECT * FROM posts WHERE post_id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: "Post created successfully!",
      post: formatPost(row)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not create post."
    });
  }
});

// UPDATE - Edit one existing post
app.put("/api/posts/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      description,
      category,
      format,
      additionalInfo
    } = req.body || {};

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof format !== "string" ||
      !format.trim() ||
      typeof additionalInfo !== "string" ||
      !additionalInfo.trim()
    ) {
      return res.status(400).json({
        error: "Invalid post information."
      });
    }

    const result = db.prepare(`
      UPDATE posts
      SET title = ?,
          category = ?,
          type = ?,
          content = ?
      WHERE post_id = ?
    `).run(
      description.trim(),
      category.trim(),
      format.trim(),
      additionalInfo.trim(),
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Post not found."
      });
    }

    const row = db.prepare(`
      SELECT * FROM posts WHERE post_id = ?
    `).get(id);

    res.json({
      message: "Post updated successfully!",
      post: formatPost(row)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not update post."
    });
  }
});

app.delete("/api/posts/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid post ID."
      });
    }

    const result = db.prepare(`
      DELETE FROM posts
      WHERE post_id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Post not found."
      });
    }

    res.json({
      message: "Post deleted successfully!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not delete post."
    });
  }
});

const finalizationsFile = path.join(
  __dirname,
  "finalizations.json"
);

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
    const existingPost = db.prepare(`
      SELECT post_id
      FROM posts
      WHERE post_id = ?
    `).get(postId);

    if (!existingPost) {
      return res.status(400).json({
        error: "Blog post not found in SQLite."
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

app.get("/api/database-test", (req, res) => {
  try {
    const tables = db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    `).all();

    const posts = db.prepare(`
      SELECT *
      FROM posts
    `).all();

    res.json({
      message: "SQLite database connected successfully!",
      tables: tables,
      posts: posts
    });

  } catch (error) {
    console.error("Database test error:", error.message);

    res.status(500).json({
      error: error.message
    });
  }
});
  app.get("/api/preferences", (req, res) => {
    try {
      const preferences = db.prepare(`
        SELECT preference_id, user_id, category, type
        FROM preferences
        ORDER BY preference_id
      `).all();

      res.json({ preferences });
    } catch (error) {
      console.error("Preferences read error:", error);
      res.status(500).json({
        error: "Could not retrieve preferences."
      });
    }
  });

  function validPreference(data) {
    return (
      data &&
      Number.isSafeInteger(data.user_id) &&
      data.user_id > 0 &&
      typeof data.category === "string" &&
      data.category.trim().length > 0 &&
      typeof data.type === "string" &&
      data.type.trim().length > 0
    );
  }
  app.post("/api/preferences", (req, res) => {
    try {
      const data = req.body;

      if (!validPreference(data)) {
        return res.status(400).json({
          error: "Valid user_id, category, and type are required."
        });
      }

      const user = db.prepare(`
        SELECT user_id FROM users WHERE user_id = ?
      `).get(data.user_id);

      if (!user) {
        return res.status(400).json({
          error: "User ID does not exist."
        });
      }

      const result = db.prepare(`
        INSERT INTO preferences
          (user_id, category, type)
        VALUES (?, ?, ?)
      `).run(
        data.user_id,
        data.category.trim(),
        data.type.trim()
      );

      const preference = db.prepare(`
        SELECT preference_id, user_id, category, type
        FROM preferences
        WHERE preference_id = ?
      `).get(result.lastInsertRowid);

      res.status(201).json({
        message: "Preference created successfully!",
        preference
      });
    } catch (error) {
      console.error("Preference create error:", error);
      res.status(500).json({
        error: "Could not create preference."
      });
    }
  });

app.put("/api/preferences/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = req.body;

      if (
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        !validPreference(data)
      ) {
        return res.status(400).json({
          error: "Invalid preference information."
        });
      }

      const user = db.prepare(`
        SELECT user_id FROM users WHERE user_id = ?
      `).get(data.user_id);

      if (!user) {
        return res.status(400).json({
          error: "User ID does not exist."
        });
      }

      const result = db.prepare(`
        UPDATE preferences
        SET user_id = ?, category = ?, type = ?
        WHERE preference_id = ?
      `).run(
        data.user_id,
        data.category.trim(),
        data.type.trim(),
        id
      );

      if (result.changes === 0) {
        return res.status(404).json({
          error: "Preference not found."
        });
      }

      const preference = db.prepare(`
        SELECT preference_id, user_id, category, type
        FROM preferences
        WHERE preference_id = ?
      `).get(id);

      res.json({
        message: "Preference updated successfully!",
        preference
      });
    } catch (error) {
      console.error("Preference update error:", error);
      res.status(500).json({
        error: "Could not update preference."
      });
    }
  });
  app.delete("/api/preferences/:id", (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "Invalid preference ID."
        });
      }

      const result = db.prepare(`
        DELETE FROM preferences
        WHERE preference_id = ?
      `).run(id);

      if (result.changes === 0) {
        return res.status(404).json({
          error: "Preference not found."
        });
      }

      res.json({
        message: "Preference deleted successfully!"
      });
    } catch (error) {
      console.error("Preference delete error:", error);
      res.status(500).json({
        error: "Could not delete preference."
      });
    }
  });
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
