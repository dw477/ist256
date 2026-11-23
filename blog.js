const DB_FILE = "./blog.db";
const GROUP_SIZE = 15;

const listContainer = document.getElementById("list-container");
const statusArea = document.getElementById("status-area");
const groupsContainer = document.getElementById("groups-container");
const paginationNav = document.getElementById("pagination-nav");

const contentContainer = document.getElementById("content-container");
const backBtn = document.getElementById("back-btn");
const postTitle = document.getElementById("post-title");
const postMeta = document.getElementById("post-meta");
const postBody = document.getElementById("post-body");

let db = null;
let postsCache = [];
let currentPage = 0;

function setStatus(msg) {
  statusArea.textContent = msg || "";
}

function showListView() {
  contentContainer.hidden = true;
  listContainer.hidden = false;
}

function showContentView() {
  listContainer.hidden = true;
  contentContainer.hidden = false;
}

function rowsToObjects(resultSet) {
  if (!resultSet || resultSet.length === 0) return [];
  const { columns, values } = resultSet[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

function renderPagination(totalPages) {
  paginationNav.innerHTML = "";

  if (totalPages <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";

  const prevLi = document.createElement("li");
  prevLi.className = `page-item${currentPage === 0 ? " disabled" : ""}`;
  const prevLink = document.createElement("a");
  prevLink.href = "#";
  prevLink.className = "page-link inactive-page-btn";
  prevLink.textContent = "Previous";
  prevLink.addEventListener("click", (event) => {
    event.preventDefault();
    if (currentPage > 0) {
      currentPage -= 1;
      renderGroups(postsCache);
    }
  });
  prevLi.appendChild(prevLink);
  ul.appendChild(prevLi);

  for (let p = 0; p < totalPages; p += 1) {
    const isActive = p === currentPage;
    const pageLi = document.createElement("li");
    pageLi.className = `page-item${isActive ? " active" : ""}`;
    if (isActive) {
      pageLi.setAttribute("aria-current", "page");
    }

    const pageLink = document.createElement("a");
    pageLink.href = "#";
    pageLink.className = `page-link ${isActive ? "active-page-btn" : "inactive-page-btn"}`;
    pageLink.textContent = String(p + 1);
    pageLink.addEventListener("click", (event) => {
      event.preventDefault();
      currentPage = p;
      renderGroups(postsCache);
    });

    pageLi.appendChild(pageLink);
    ul.appendChild(pageLi);
  }

  const nextLi = document.createElement("li");
  nextLi.className = `page-item${currentPage >= totalPages - 1 ? " disabled" : ""}`;
  const nextLink = document.createElement("a");
  nextLink.href = "#";
  nextLink.className = "page-link inactive-page-btn";
  nextLink.textContent = "Next";
  nextLink.addEventListener("click", (event) => {
    event.preventDefault();
    if (currentPage < totalPages - 1) {
      currentPage += 1;
      renderGroups(postsCache);
    }
  });
  nextLi.appendChild(nextLink);
  ul.appendChild(nextLi);

  paginationNav.appendChild(ul);
}

function renderGroups(posts) {
  groupsContainer.innerHTML = "";
  paginationNav.innerHTML = "";

  if (!Array.isArray(posts) || posts.length === 0) {
    setStatus("No posts found in blog.db.");
    return;
  }

  setStatus("");

  const totalPages = Math.ceil(posts.length / GROUP_SIZE);
  if (currentPage >= totalPages) {
    currentPage = totalPages - 1;
  }
  if (currentPage < 0) {
    currentPage = 0;
  }

  const start = currentPage * GROUP_SIZE;
  const slice = posts.slice(start, start + GROUP_SIZE);

  const groupSection = document.createElement("section");

  const heading = document.createElement("h3");
  heading.textContent = `${start + 1} - ${start + slice.length}`;
  groupSection.appendChild(heading);

  const listGroup = document.createElement("div");
  listGroup.className = "list-group";

  slice.forEach((post) => {
    const link = document.createElement("a");
    link.href = "#";
    link.className = "list-group-item list-group-item-action announcements";

    const titleEl = document.createElement("h6");
    const strongEl = document.createElement("strong");
    strongEl.textContent = post.title ?? `Post ${post.post_id}`;
    titleEl.appendChild(strongEl);
    link.appendChild(titleEl);

    if (post.category || post.type) {
      const metaEl = document.createElement("p");
      metaEl.textContent = [post.category, post.type].filter(Boolean).join(" • ");
      link.appendChild(metaEl);
    }

    link.addEventListener("click", (event) => {
      event.preventDefault();
      loadPost(post.post_id);
    });

    listGroup.appendChild(link);
  });

  groupSection.appendChild(listGroup);
  groupsContainer.appendChild(groupSection);

  renderPagination(totalPages);
}

function formatMeta(post) {
  const parts = [];
  if (post.category) parts.push(`Category: ${post.category}`);
  if (post.type) parts.push(`Type: ${post.type}`);
  return parts.join(" | ");
}

function loadPost(postId) {
  if (!db) return;

  showContentView();
  setStatus("");
  postTitle.textContent = "Loading...";
  postMeta.textContent = "";
  postBody.textContent = "";

  try {
    const stmt = db.prepare(
      "SELECT post_id, title, category, type, content FROM posts WHERE post_id = :id"
    );
    stmt.bind({ ":id": Number(postId) });

    let post = null;
    if (stmt.step()) {
      post = stmt.getAsObject();
    }
    stmt.free();

    if (!post) {
      postTitle.textContent = "Post not found";
      postBody.textContent = `No post found with post_id = ${postId}.`;
      return;
    }

    postTitle.textContent = post.title ?? "";
    postMeta.textContent = formatMeta(post);
    postBody.textContent = post.content ?? "";
  } catch (err) {
    postTitle.textContent = "Error loading post";
    postBody.textContent = err.message;
  }
}

async function autoLoadBlogDb() {
  showListView();
  setStatus("Loading blog.db...");

  try {
    const SQL = await initSqlJs({
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    const response = await fetch(DB_FILE);
    if (!response.ok) {
      throw new Error(`Could not load ${DB_FILE} (HTTP ${response.status})`);
    }

    const buffer = await response.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buffer));

    const result = db.exec(
      "SELECT post_id, title, category, type FROM posts ORDER BY post_id ASC"
    );
    postsCache = rowsToObjects(result);
    currentPage = 0;

    renderGroups(postsCache);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
}

backBtn.addEventListener("click", () => {
  showListView();
  renderGroups(postsCache);
});

function promptLocalDbFallback() {
  statusArea.innerHTML = "";

  const msg = document.createElement("p");
  msg.textContent = "Browser blocked automatic fetch on file://. Select blog.db from your folder:";

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".db,.sqlite,.sqlite3";

  input.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    setStatus("Loading selected blog.db...");
    try {
      const SQL = await initSqlJs({
        locateFile: (fileName) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${fileName}`
      });
      const buffer = await file.arrayBuffer();
      if (db) db.close();
      db = new SQL.Database(new Uint8Array(buffer));

      const result = db.exec(
        "SELECT post_id, title, category, type FROM posts ORDER BY post_id ASC"
      );
      postsCache = rowsToObjects(result);
      currentPage = 0;
      renderGroups(postsCache);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  });

  statusArea.appendChild(msg);
  statusArea.appendChild(input);
}

document.addEventListener("DOMContentLoaded", autoLoadBlogDb);