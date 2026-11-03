// Same original history-page layout; safely display files and make saved merges downloadable.
document.addEventListener("DOMContentLoaded", function () {
  const historyList = document.querySelector(".history-list");

  fetch("/get-history")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    })
    .then((history) => {
      if (history.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No merged PDFs yet. Merge a few documents to see them here.";
        historyList.appendChild(empty);
      }
      history.forEach((item) => {
        const listItem = document.createElement("div");
        listItem.className = "history-item";
        const details = document.createElement("div");
        const files = document.createElement("p");
        files.textContent = Array.isArray(item.originalFiles) ? item.originalFiles.join(", ") : "Merged document";
        const date = document.createElement("p");
        date.textContent = item.date ? new Date(item.date).toLocaleString() : "";
        details.append(files, date);
        listItem.appendChild(details);
        if (item.downloadUrl) {
          const download = document.createElement("a");
          download.href = item.downloadUrl;
          download.textContent = "Download PDF";
          download.setAttribute("download", "");
          listItem.appendChild(download);
        }
        historyList.appendChild(listItem);
      });
    })
    .catch((err) => {
      console.error("Error fetching history:", err);
      const error = document.createElement("p");
      error.textContent = "Could not load merge history. Please retry.";
      historyList.appendChild(error);
    });
});
