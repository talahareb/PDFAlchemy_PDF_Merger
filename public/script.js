document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("file-input");
  const message = document.getElementById("message");
  const form = document.getElementById("pdf-merger-form");

  fileInput.addEventListener("change", function () {
    const files = fileInput.files;
    if (files.length === 0) {
      message.textContent = "No file chosen";
    } else if (files.length < 2 || files.length > 5) {
      message.textContent = "Please select between 2 to 5 PDF files.";
    } else {
      message.textContent = `${files.length} file(s) selected`;
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const files = fileInput.files;

    if (files.length < 2 || files.length > 5) {
      message.textContent = "Please select between 2 to 5 PDF files.";
      return;
    }

    message.textContent = "Merging PDFs...";

    const formData = new FormData(form);

    fetch("/merge-pdfs", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        console.log(response); // Add this line to inspect the response
        if (!response.ok) {
          throw new Error("Failed to merge PDFs");
        }
        return response.blob(); // Expecting the file as a blob
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const a = document.createElement("a");
        a.href = url;
        a.download = "merged.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        message.textContent = "PDFs merged successfully";
      })
      .catch((err) => {
        console.error("Error:", err);
        message.textContent = "Error merging PDFs";
      });
  });
});
