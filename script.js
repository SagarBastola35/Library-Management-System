
// GLOBAL STATE 
let books = []; // Array of book objects
let currentFilter = ""; // search query
let currentSection = "home"; // for navbar highlighting

// DOM Elements
const booksGrid = document.getElementById("booksGrid");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const addBookForm = document.getElementById("addBookForm");
const statsPills = document.getElementById("statsPills");
const bookCountBadge = document.getElementById("bookCountBadge");
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const navLinks = document.getElementById("navLinks");
const navLinkItems = document.querySelectorAll(".nav-link");
const addBookSection = document.getElementById("add-book-section");
const heroSection = document.querySelector(".hero-section");
const modalOverlay = document.getElementById("editModal");
const editBookForm = document.getElementById("editBookForm");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");

// Helper: Save to localStorage
function saveToLocalStorage() {
  localStorage.setItem("libraryBooks", JSON.stringify(books));
}

// Helper: Load from localStorage
function loadFromLocalStorage() {
  const stored = localStorage.getItem("libraryBooks");
  if (stored) {
    books = JSON.parse(stored);
  } else {
    // Seed with sample data for demonstration
    books = [
      {
        id: "1",
        title: "The Midnight Library",
        author: "Matt Haig",
        isbn: "9780525559474",
        year: 2020,
        status: "available",
      },
      {
        id: "2",
        title: "Project Hail Mary",
        author: "Andy Weir",
        isbn: "9780593135204",
        year: 2021,
        status: "borrowed",
      },
      {
        id: "3",
        title: "Dune",
        author: "Frank Herbert",
        isbn: "9780441013593",
        year: 1965,
        status: "available",
      },
    ];
    saveToLocalStorage();
  }
}

// Helper: Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

//  RENDER FUNCTIONS 
// Filter books based on search query
function getFilteredBooks() {
  if (!currentFilter.trim()) return books;
  const query = currentFilter.trim().toLowerCase();
  return books.filter(
    (book) =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.isbn.toLowerCase().includes(query),
  );
}

// Update stats pills (total, available, borrowed)
function updateStats() {
  const total = books.length;
  const available = books.filter((b) => b.status === "available").length;
  const borrowed = total - available;
  statsPills.innerHTML = `
    <div class="stat-pill"><i class="fas fa-book"></i> Total: ${total}</div>
    <div class="stat-pill"><i class="fas fa-check-circle"></i> Available: ${available}</div>
    <div class="stat-pill"><i class="fas fa-exchange-alt"></i> Borrowed: ${borrowed}</div>
  `;
  bookCountBadge.textContent = `${total} book${total !== 1 ? "s" : ""}`;
}

// Render books grid
function renderBooks() {
  const filtered = getFilteredBooks();
  if (!filtered.length) {
    booksGrid.innerHTML = `<div class="loading-placeholder"><i class="fas fa-info-circle"></i> No books found. Add your first book!</div>`;
    return;
  }
  booksGrid.innerHTML = filtered
    .map(
      (book) => `
    <div class="book-card" data-id="${book.id}">
      <div class="book-title">
        <span>${escapeHtml(book.title)}</span>
        <span class="book-status ${book.status === "available" ? "status-available" : "status-borrowed"}">
          ${book.status === "available" ? "Available" : "Borrowed"}
        </span>
      </div>
      <div class="book-author"><i class="fas fa-user-pen"></i> ${escapeHtml(book.author)}</div>
      <div class="book-meta">
        <span><i class="fas fa-barcode"></i> ${escapeHtml(book.isbn)}</span>
        <span><i class="fas fa-calendar"></i> ${book.year}</span>
      </div>
      <div class="book-actions">
        <button class="action-btn btn-edit" data-id="${book.id}" data-action="edit"><i class="fas fa-edit"></i> Edit</button>
        <button class="action-btn btn-toggle ${book.status === "borrowed" ? "borrowed" : ""}" data-id="${book.id}" data-action="toggle">
          <i class="fas ${book.status === "available" ? "fa-hand-holding-heart" : "fa-undo-alt"}"></i> 
          ${book.status === "available" ? "Borrow" : "Return"}
        </button>
        <button class="action-btn btn-delete" data-id="${book.id}" data-action="delete"><i class="fas fa-trash-alt"></i> Delete</button>
      </div>
    </div>
  `,
    )
    .join("");
  attachBookCardEvents();
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/[&<>]/g, function (m) {
      if (m === "&") return "&amp;";
      if (m === "<") return "&lt;";
      if (m === ">") return "&gt;";
      return m;
    })
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (c) {
      return c;
    });
}

// Attach event listeners to dynamically generated buttons
function attachBookCardEvents() {
  document.querySelectorAll(".action-btn").forEach((btn) => {
    btn.removeEventListener("click", handleBookAction);
    btn.addEventListener("click", handleBookAction);
  });
}

function handleBookAction(e) {
  const btn = e.currentTarget;
  const bookId = btn.getAttribute("data-id");
  const action = btn.getAttribute("data-action");
  if (action === "edit") {
    openEditModal(bookId);
  } else if (action === "toggle") {
    toggleBookStatus(bookId);
  } else if (action === "delete") {
    deleteBook(bookId);
  }
}

// CRUD OPERATIONS
// Add new book
function addBook(title, author, isbn, year) {
  // Validate inputs
  if (!title.trim() || !author.trim() || !isbn.trim() || !year) {
    alert("Please fill all required fields.");
    return false;
  }
  // Check for duplicate ISBN (optional)
  if (
    books.some((book) => book.isbn.toLowerCase() === isbn.trim().toLowerCase())
  ) {
    alert("A book with this ISBN already exists.");
    return false;
  }
  const newBook = {
    id: generateId(),
    title: title.trim(),
    author: author.trim(),
    isbn: isbn.trim(),
    year: parseInt(year),
    status: "available",
  };
  books.push(newBook);
  saveToLocalStorage();
  renderBooks();
  updateStats();
  // Clear form
  document.getElementById("title").value = "";
  document.getElementById("author").value = "";
  document.getElementById("isbn").value = "";
  document.getElementById("year").value = "";
  return true;
}

// Toggle borrow/return
function toggleBookStatus(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (book) {
    book.status = book.status === "available" ? "borrowed" : "available";
    saveToLocalStorage();
    renderBooks();
    updateStats();
  }
}

// Delete book
function deleteBook(bookId) {
  if (confirm("Are you sure you want to delete this book?")) {
    books = books.filter((b) => b.id !== bookId);
    saveToLocalStorage();
    renderBooks();
    updateStats();
  }
}

// Edit book modal
let currentEditId = null;
function openEditModal(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;
  currentEditId = bookId;
  document.getElementById("editBookId").value = bookId;
  document.getElementById("editTitle").value = book.title;
  document.getElementById("editAuthor").value = book.author;
  document.getElementById("editIsbn").value = book.isbn;
  document.getElementById("editYear").value = book.year;
  modalOverlay.classList.add("active");
}

function closeModal() {
  modalOverlay.classList.remove("active");
  currentEditId = null;
}

function saveEditBook(e) {
  e.preventDefault();
  const bookId = document.getElementById("editBookId").value;
  const title = document.getElementById("editTitle").value.trim();
  const author = document.getElementById("editAuthor").value.trim();
  const isbn = document.getElementById("editIsbn").value.trim();
  const year = parseInt(document.getElementById("editYear").value);
  if (!title || !author || !isbn || !year) {
    alert("All fields are required.");
    return;
  }
  // Check ISBN uniqueness (excluding current book)
  if (
    books.some(
      (book) =>
        book.id !== bookId && book.isbn.toLowerCase() === isbn.toLowerCase(),
    )
  ) {
    alert("Another book already has this ISBN.");
    return;
  }
  const bookIndex = books.findIndex((b) => b.id === bookId);
  if (bookIndex !== -1) {
    books[bookIndex] = { ...books[bookIndex], title, author, isbn, year };
    saveToLocalStorage();
    renderBooks();
    updateStats();
    closeModal();
  }
}

// SEARCH & UI 
function handleSearch() {
  currentFilter = searchInput.value;
  renderBooks();
  updateStats(); // stats remain same but re-render for consistency
}

function clearSearch() {
  searchInput.value = "";
  currentFilter = "";
  renderBooks();
  searchInput.focus();
}

// ======================== NAVIGATION / SMOOTH SCROLL & ACTIVE TAB ========================
function setActiveNav(sectionId) {
  navLinkItems.forEach((link) => {
    const targetSection = link.getAttribute("data-section");
    if (targetSection === sectionId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function scrollToSection(sectionId) {
  if (sectionId === "home") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveNav("home");
  } else if (sectionId === "add-book-section") {
    addBookSection.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveNav("add-book-section");
  } else if (sectionId === "stats") {
    // Scroll to stats pills
    statsPills.scrollIntoView({ behavior: "smooth", block: "center" });
    setActiveNav("stats");
  }
}

// ======================== RESPONSIVE MENU ========================
function toggleMobileMenu() {
  navLinks.classList.toggle("active");
}

function closeMobileMenu() {
  navLinks.classList.remove("active");
}

// ======================== INITIALIZE APP ========================
function init() {
  loadFromLocalStorage();
  renderBooks();
  updateStats();

  // Event listeners
  addBookForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const author = document.getElementById("author").value;
    const isbn = document.getElementById("isbn").value;
    const year = document.getElementById("year").value;
    addBook(title, author, isbn, year);
  });

  searchInput.addEventListener("input", handleSearch);
  clearSearchBtn.addEventListener("click", clearSearch);

  // Navbar link clicks
  navLinkItems.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.getAttribute("data-section");
      scrollToSection(section);
      closeMobileMenu();
    });
  });

  mobileMenuToggle.addEventListener("click", toggleMobileMenu);
  // Close mobile menu on window resize if open
  window.addEventListener("resize", () => {
    if (window.innerWidth > 780 && navLinks.classList.contains("active")) {
      navLinks.classList.remove("active");
    }
  });

  // Modal events
  editBookForm.addEventListener("submit", saveEditBook);
  closeModalBtn.addEventListener("click", closeModal);
  cancelModalBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Set footer year
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  
}

document.addEventListener("DOMContentLoaded", init);
