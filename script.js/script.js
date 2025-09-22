document.addEventListener('DOMContentLoaded', () => {
  // =================================================================
  // --- Local Storage Helpers with Error Handling ---
  const CART_STORAGE_KEY = 'fashion_cart_v1';

  function getLocalCart() {
    try {
      const localData = localStorage.getItem(CART_STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
    } catch (e) {
      console.error("Could not read cart from localStorage:", e);
      return [];
    }
  }

  function saveLocalCart(cart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Could not save cart to localStorage:", e);
    }
  }

  function clearLocalCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  // =================================================================
  // --- DOM Element References ---
const sideMenu = document.getElementById("side-menu");
const closeBtn = document.getElementById("close-btn");
const hamburger = document.querySelector(".hamburger");

const loginIcon = document.getElementById("login-icon");
const logoutContainer = document.getElementById("logout-container");
const cartIcon = document.getElementById("cart-icon");

  // =================================================================
  // --- UI Event Listeners (Navigation & Side Menu) ---
// Open/Close side menu
hamburger.addEventListener("click", () => {
  sideMenu.classList.add("open");
});

closeBtn.addEventListener("click", () => {
  sideMenu.classList.remove("open");
});

// Smooth scroll for side menu links
document.querySelectorAll('.side-menu ul li a').forEach(link => {
  link.addEventListener('click', () => {
    sideMenu.classList.remove('open');
  });
});

// Login → go to login page
loginIcon.addEventListener("click", () => {
  window.location.href = "login.html";
});

// Cart → require login
cartIcon.addEventListener("click", () => window.location.href = 'cart.html');

  // =================================================================
  // --- Homepage Slideshow Logic ---
//slideshow
let slideIndex = 0;
const slides = document.querySelectorAll(".slide");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");
let autoSlide;

// Show slide with fade effect
function showActiveSlide() {
  slides.forEach((slide, i) => {
    slide.classList.remove("active");
    slide.style.opacity = 0;
    slide.style.zIndex = 0;
  });
  slides[slideIndex].classList.add("active");
  slides[slideIndex].style.opacity = 1;
  slides[slideIndex].style.zIndex = 1;
}

// Next slide
function nextSlide() {
  slideIndex = (slideIndex + 1) % slides.length;
  showActiveSlide();
}

// Previous slide
function prevSlide() {
  slideIndex = (slideIndex - 1 + slides.length) % slides.length;
  showActiveSlide();
}

// Auto slideshow
function startAutoSlide() {
  autoSlide = setInterval(nextSlide, 4000);
}

// Reset auto when user interacts
function resetAutoSlide() {
  clearInterval(autoSlide);
  startAutoSlide();
}

function initializeSlideshow() {
  // On mobile, we use native scrolling, so we don't initialize the JS-based slideshow.
  if (window.innerWidth <= 768) {
    // Ensure all slides are visible for scrolling
    slides.forEach(slide => {
      slide.style.display = 'block';
      slide.style.opacity = 1;
    });
    return;
  }

  // On desktop, set up the JS-controlled slideshow
  nextBtn.addEventListener("click", () => { nextSlide(); resetAutoSlide(); });
  prevBtn.addEventListener("click", () => { prevSlide(); resetAutoSlide(); });

  showActiveSlide();
  startAutoSlide();
}

initializeSlideshow();
//end of slideshow

  // =================================================================
  // --- Product Filtering Logic (Homepage) ---
// Function to filter products by size
function filterProducts(categoryId, selectId) {
  const select = document.getElementById(selectId);
  const products = document.getElementById(categoryId).getElementsByClassName('product');

  select.addEventListener('change', () => {
    const selectedSize = select.value;

    for (let product of products) {
      const sizeText = product.querySelector('.details').textContent; // e.g., "Sizes: 38-44 · $25.00"
      // Replace en-dash with normal dash and extract numbers
      const sizeRange = sizeText.replace('–', '-').match(/\d+/g).map(Number);

      if (selectedSize === 'all') {
        product.style.display = 'block';
      } else {
        const size = Number(selectedSize);
        if (size >= sizeRange[0] && size <= sizeRange[1]) {
          product.style.display = 'block';
        } else {
          product.style.display = 'none';
        }
      }
    }
  });
}

  // =================================================================
  // --- Shared UI Components (Cart Count & Notifications) ---
/**
 * Updates the cart count badge in the header.
 */
function updateCartCount() {
  const cartCountBadge = document.getElementById("cart-count");
  if (!cartCountBadge) return;
  
  const cart = getLocalCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (totalItems > 0) {
    cartCountBadge.textContent = totalItems;
    cartCountBadge.style.display = "block";
  } else {
    cartCountBadge.style.display = "none";
  }
}

/**
 * Displays a styled notification on the screen.
 * @param {string} message The message to display.
 * @param {string} type The type of notification ('success', 'error', etc.).
 */function showNotification(message, type = 'success') {
  const container = document.getElementById('notification-container');
  if (!container) return;
  const notification = document.createElement('div');
  notification.className = `notification ${type} show`;
  notification.textContent = message;
  container.appendChild(notification);
  setTimeout(() => {
    notification.classList.remove('show');
    notification.addEventListener('transitionend', () => notification.remove());
  }, 3000);
}

  // =================================================================
  // --- Homepage "Add to Cart" Logic ---
const cartButtons = document.querySelectorAll(".add-to-cart");

cartButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    const id = btn.dataset.id; 

    showNotification('Please select a size on the product page.', 'error');
    setTimeout(() => {
      window.location.href = `product.html?id=${id}`;
    }, 1500);
  });
});

  
// --- Authentication Flow ---

/**
 * Checks the user's login status with the backend and updates the UI.
 * This is the single source of truth for authentication state.
 */
async function checkAndUpdateAuthUI() {
  let isLoggedIn = false;
  let user = null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
      method: 'GET',
      credentials: 'include', 
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const authState = await response.json();
    isLoggedIn = authState.isLoggedIn;
    user = authState.user;

    // Update UI based on server response
    if (isLoggedIn) {
      loginIcon.parentElement.style.display = 'none'; // Hide login container
      logoutContainer.style.display = 'flex'; // Show logout container
    } else {
      loginIcon.parentElement.style.display = 'flex'; // Show login container
      logoutContainer.style.display = 'none'; // Hide logout container
    }
  } catch (error) {
    console.error('Could not fetch authentication status:', error);
    loginIcon.parentElement.style.display = 'flex';
    logoutContainer.style.display = 'none';
  } finally {
    return { isLoggedIn, user };
  }
}

/**
 * Handles the user clicking the logout button.
 */
document.getElementById('logout-icon').addEventListener('click', async () => {
  try {
    await fetch(`${API_BASE_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include', 
    });
    window.location.href = 'index.html'; 
  } catch (error) {
    console.error('Logout failed:', error);
    showNotification('Logout failed. Please try again.', 'error');
  }
});

  // =================================================================
// --- Initial Page Load ---
  // Check login state and handle welcome messages
  (async () => {
    const { isLoggedIn, user } = await checkAndUpdateAuthUI();
    if (isLoggedIn) updateCartCount(); // Update cart count if user is logged in
    const params = new URLSearchParams(window.location.search);

    // If the URL has `login_success=true` and the user is logged in, show a welcome message.
    if (params.has('login_success') && isLoggedIn) {
      const name = user ? user.name : null;
      const message = name ? `Welcome back, ${name}!` : `Welcome back!`;
      showNotification(message);

      // Clean up the URL so the message doesn't show on refresh.
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  })();

    // Set up other event listeners that depend on the DOM.
    filterProducts('boys-products', 'boys-size');
    filterProducts('girls-products', 'girls-size');
});
