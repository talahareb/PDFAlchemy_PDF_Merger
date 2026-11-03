const PDFMerger = require("pdf-merger-js");
const path = require("path");
const fs = require("fs");

exports.mergePDFs = async (req, res) => {
  try {
    const merger = new PDFMerger();

    // Add each file to the merger
    req.files.forEach((file) => {
      merger.add(file.path);
    });

    const outputFilePath = path.join(
      __dirname,
      "public",
      "merged-pdfs",
      `merged-${Date.now()}.pdf`
    );

    // Save the merged file
    await merger.save(outputFilePath);

    // Send the merged file as a response to the client
    res.download(outputFilePath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).json({ message: "Error merging PDFs" });
      } else {
        // Optionally delete the file after sending
        fs.unlink(outputFilePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting merged PDF:", unlinkErr);
          }
        });
      }
    });
  } catch (err) {
    console.error("Error during PDF merging:", err);
    res.status(500).json({ message: "Error merging PDFs" });
  }
};
