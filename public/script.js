const input = document.getElementById("url");
input.focus();
input.value = "https://";

const home = document.getElementById("home");
const submitted = document.getElementById("submitted");
const copyLongUrlbutton = document.getElementById("copy-long-url-btn");
const longUrl = document.getElementById("long-url");
const form = document.getElementById("form");
const copyAlert = document.querySelector(".copied-alert");
const toUrlHeading = document.getElementById("to-url-heading");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  e.stopPropagation();

  fetch("/url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    type: "json",
    body: JSON.stringify({
      toUrl: input.value,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      longUrl.innerText = data.url;
      toUrlHeading.innerText = data.toUrl;

      home.classList.add("hidden");
      setTimeout(function () {
        submitted.classList.remove("hidden");
      }, 250);
    });
});

copyLongUrlbutton.addEventListener("click", () => {
  copyAlert.classList.remove("fade");
  try {
    longUrl.focus();
    longUrl.select();
    document.execCommand("copy");
    copyAlert.classList.add("fade");
  } catch (e) {
    console.error("Something went wrong when trying to copy.", e);
  }
});
