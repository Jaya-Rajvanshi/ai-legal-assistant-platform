import PDFDocument from "pdfkit";

/**
 * Generate Missing Person Poster PDF and pipe to response.
 * @param {Object} report - { fullName, age, gender, lastSeenLocation, dateLastSeen, description, photo?, contactName, contactPhone }
 * @param {import('express').Response} res
 */
export const generateMissingPersonPosterPdf = (report, res) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="missing-person-${(report.fullName || "alert").replace(/\s+/g, "-")}.pdf"`
  );

  doc.pipe(res);

  doc
    .fontSize(20)
    .fillColor("#D72638")
    .text("MISSING PERSON ALERT", { align: "center" })
    .moveDown(1);

  doc.fontSize(10).fillColor("black");

  const dateStr =
    report.dateLastSeen instanceof Date
      ? report.dateLastSeen.toLocaleDateString()
      : report.dateLastSeen;

  doc.text(`Name: ${report.fullName || "—"}`, { continued: false });
  doc.text(`Age: ${report.age != null ? report.age : "—"}`);
  if (report.gender) doc.text(`Gender: ${report.gender}`);
  doc.text(`Last seen location: ${report.lastSeenLocation || "—"}`);
  doc.text(`Date last seen: ${dateStr || "—"}`);
  doc.text(`Contact: ${report.contactName || "—"} - ${report.contactPhone || "—"}`);
  doc.moveDown(2);

  doc.text("Description:", { underline: true });
  doc.text(report.description || "No description provided.", {
    align: "justify",
  });

  doc.moveDown(2);
  doc
    .fontSize(10)
    .fillColor("#0B3C5D")
    .text("If you have any information, please contact the number above.", {
      align: "center",
    });

  doc.end();
};
