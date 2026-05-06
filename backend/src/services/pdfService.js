import PDFDocument from "pdfkit";

export const generateComplaintPdf = (options, res) => {
  const {
    title = "Police Complaint / FIR Draft",
    complainantName,
    complainantAddress,
    contactNumber,
    body,
  } = options;

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="complaint-draft.pdf"'
  );

  doc.pipe(res);

  doc
    .fontSize(18)
    .fillColor("#0B3C5D")
    .text(title, { align: "center" })
    .moveDown(2);

  doc.fontSize(12).fillColor("black");

  if (complainantName) {
    doc.text(`Complainant: ${complainantName}`);
  }
  if (complainantAddress) {
    doc.text(`Address: ${complainantAddress}`);
  }
  if (contactNumber) {
    doc.text(`Contact: ${contactNumber}`);
  }

  doc.moveDown(2);
  doc.text("To,", { continued: false });
  doc.text("The Station House Officer,");
  doc.text("Concerned Police Station.");
  doc.moveDown(2);

  doc.text(body || "Complaint details go here.", {
    align: "justify",
  });

  doc.moveDown(3);
  doc.text("Yours faithfully,");
  doc.moveDown();
  doc.text(complainantName || "____________________");

  doc.end();
};

