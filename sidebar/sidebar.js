// sidebar.js

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element References ---
  const requestTypeRadios = document.querySelectorAll(
    'input[name="request-type"]'
  );
  const urlInput = document.getElementById("url-input");
  const headersContainer = document.getElementById("headers-container");
  const addHeaderBtn = document.getElementById("add-header-btn");
  const postBodyContainer = document.getElementById("post-body-container");
  const postBodyInput = document.getElementById("post-body");
  const sendRequestBtn = document.getElementById("send-request-btn");
  const responseContainer = document.getElementById("response-container");
  const responseContentText = document.getElementById("response-content-text");
  const responseContentImage = document.getElementById(
    "response-content-image"
  );
  const responseViewRadios = document.querySelectorAll(
    'input[name="response-view"]'
  );
  const stars = document.querySelectorAll(".star");
  const reviewBtn = document.getElementById("reviewBtn");

  // Store the last successful response object
  let lastResponse = null;

  // --- Functions ---

  const clearResponse = () => {
    responseContainer.classList.remove("error");
    responseContentText.textContent = "";
    responseContentImage.src = "";
    responseContentImage.style.display = "none";
    responseContentText.style.display = "block";
  };

  const addHeaderRow = () => {
    const row = document.createElement("div");
    row.className = "header-row";
    row.innerHTML = `
            <input type="text" class="input-field header-key" placeholder="Header Name">
            <input type="text" class="input-field header-value" placeholder="Header Value">
            <button type="button" class="button-danger remove-header-btn">X</button>
        `;
    headersContainer.appendChild(row);
  };

  const handleRequestTypeChange = () => {
    const selectedType = document.querySelector(
      'input[name="request-type"]:checked'
    ).value;
    if (selectedType === "POST") {
      postBodyContainer.classList.remove("hidden");
    } else {
      postBodyContainer.classList.add("hidden");
    }
  };

  const renderResponse = async () => {
    if (!lastResponse) {
      clearResponse();
      return;
    }

    const viewType = document.querySelector(
      'input[name="response-view"]:checked'
    ).value;
    clearResponse();

    // Clone the response so it can be read multiple times
    const responseClone = lastResponse.clone();

    try {
      switch (viewType) {
        case "image":
          const blob = await responseClone.blob();
          if (blob.type.startsWith("image/")) {
            responseContentImage.src = URL.createObjectURL(blob);
            responseContentImage.style.display = "block";
            responseContentText.style.display = "none";
          } else {
            responseContentText.textContent =
              "Response is not a displayable image.";
          }
          break;

        case "headers":
          let headersText = `Status: ${responseClone.status} ${responseClone.statusText}\n\n`;
          for (const [key, value] of responseClone.headers.entries()) {
            headersText += `${key}: ${value}\n`;
          }
          responseContentText.textContent = headersText;
          break;

        case "text":
          responseContentText.textContent = await responseClone.text();
          break;

        case "auto":
        default:
          const contentType = responseClone.headers.get("content-type");
          if (contentType && contentType.startsWith("image/")) {
            const imageBlob = await responseClone.blob();
            responseContentImage.src = URL.createObjectURL(imageBlob);
            responseContentImage.style.display = "block";
            responseContentText.style.display = "none";
          } else if (contentType && contentType.includes("application/json")) {
            const data = await responseClone.json();
            responseContentText.textContent = JSON.stringify(data, null, 2);
          } else {
            const textData = await responseClone.text();
            responseContentText.textContent = textData || "(Empty Response)";
          }
          break;
      }
    } catch (error) {
      console.error("Render Error:", error);
      responseContentText.textContent = `Error rendering response.\n${error.message}`;
      responseContainer.classList.add("error");
    }
  };

  const sendRequest = async () => {
    const requestType = document.querySelector(
      'input[name="request-type"]:checked'
    ).value;
    const url = urlInput.value;

    if (!url) {
      clearResponse();
      lastResponse = null;
      responseContentText.textContent = "Error: Please enter a URL.";
      responseContainer.classList.add("error");
      return;
    }

    clearResponse();
    lastResponse = null;
    responseContentText.textContent = "Loading...";
    sendRequestBtn.disabled = true;
    sendRequestBtn.textContent = "Sending...";

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json, image/*, text/plain, */*",
    };

    document.querySelectorAll(".header-row").forEach((row) => {
      const key = row.querySelector(".header-key").value.trim();
      const value = row.querySelector(".header-value").value.trim();
      if (key && value) {
        headers[key] = value;
      }
    });

    const fetchOptions = { method: requestType, headers: headers };

    if (requestType === "POST") {
      try {
        const body = JSON.parse(postBodyInput.value || "{}");
        fetchOptions.body = JSON.stringify(body);
      } catch (error) {
        responseContentText.textContent = `Error: Invalid JSON in request body.\n${error.message}`;
        responseContainer.classList.add("error");
        sendRequestBtn.disabled = false;
        sendRequestBtn.textContent = "Send Request";
        return;
      }
    }

    try {
      lastResponse = await fetch(url, fetchOptions);
      await renderResponse();
    } catch (error) {
      console.error("Fetch Error:", error);
      clearResponse();
      lastResponse = null;
      responseContentText.textContent = `Error: Failed to fetch.\n${error.message}`;
      responseContainer.classList.add("error");
    } finally {
      sendRequestBtn.disabled = false;
      sendRequestBtn.textContent = "Send Request";
    }
  };

  // --- Review Logic ---
  let currentRating = 0;

  const setStarRating = (rating) => {
    stars.forEach((star) => {
      if (parseInt(star.dataset.value) <= rating) {
        star.classList.add("selected");
      } else {
        star.classList.remove("selected");
      }
    });
  };

  stars.forEach((star) => {
    star.addEventListener("mouseover", () => {
      const rating = parseInt(star.dataset.value);
      // Temporarily highlight on hover
      for (let i = 0; i < 5; i++) {
        stars[i].style.color =
          i < rating
            ? "var(--star-selected-color)"
            : "var(--input-border-color)";
      }
    });

    star.addEventListener("mouseout", () => {
      // Revert to the selected rating by removing inline styles
      stars.forEach((s) => {
        s.style.color = "";
      });
    });

    star.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent navigation
      currentRating = parseInt(star.dataset.value);
      setStarRating(currentRating);
    });
  });

  // --- Review Button ---
  reviewBtn.addEventListener("click", () => {
    // reviewBtn.textContent = "Thank you for your feedback!";
    // In a real extension, you would get your ID from the web store
    // and uncomment the line below to open the review page.
    chrome.tabs.create({
      url: "https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID/reviews",
    });
  });

  // --- Footer Links ---
  document.getElementById("donateLink").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "https://coff.ee/dizaraj" });
  });

  document.getElementById("aboutLink").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "https://dizaraj.github.io" });
  });
  
  // --- Event Listeners ---
  addHeaderBtn.addEventListener("click", addHeaderRow);

  headersContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-header-btn")) {
      e.target.closest(".header-row").remove();
    }
  });

  requestTypeRadios.forEach((radio) => {
    radio.addEventListener("change", handleRequestTypeChange);
  });

  responseViewRadios.forEach((radio) => {
    radio.addEventListener("change", renderResponse);
  });

  sendRequestBtn.addEventListener("click", sendRequest);

  // --- Initial State ---
  handleRequestTypeChange();
  addHeaderRow();
});
