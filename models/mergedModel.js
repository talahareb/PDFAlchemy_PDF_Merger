const mongoose = require("mongoose");

const pdfMergeSchema = new mongoose.Schema({
    files : [String],
    mergedFile : String,
    createdAt : {
        type : Date,
        default : Date.now
    }
});

module.exports = mongoose.model("PdfMerge", pdfMergeSchema);