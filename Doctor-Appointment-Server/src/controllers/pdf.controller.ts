import { Request, Response, NextFunction } from "express";
import PDFDocument from "pdfkit";
import { Prescription } from "../models/Prescription";
import { NotFoundError, UnauthorizedError } from "../utils/errors";

export async function downloadPrescription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { id } = req.params;

    const prescription = await Prescription.findById(id)
      .populate("patientId", "firstName lastName email phone")
      .populate("doctorId", "firstName lastName email")
      .lean();

    if (!prescription) throw new NotFoundError("Prescription not found");

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=prescription-${id}.pdf`,
    );
    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Viazo Medical Center", { align: "center" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("123 Healthcare Ave, Medical District", { align: "center" });
    doc.text("Phone: +91-123-456-7890 | Email: info@viamed.com", {
      align: "center",
    });
    doc.moveDown(0.5);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Prescription header
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("PRESCRIPTION", { align: "center" });
    doc.moveDown(0.5);

    // Patient & Doctor info
    const patientName = `${(prescription.patientId as any)?.firstName || ""} ${(prescription.patientId as any)?.lastName || ""}`;
    const doctorName = `${(prescription.doctorId as any)?.firstName || ""} ${(prescription.doctorId as any)?.lastName || ""}`;
    const createdAt = (prescription as any).createdAt;
    const date = createdAt
      ? new Date(createdAt).toLocaleDateString()
      : "N/A";

    doc.fontSize(11).font("Helvetica");
    doc
      .text(`Patient: ${patientName}`, { continued: true })
      .text(`Date: ${date}`, { align: "right" });
    doc.text(`Doctor: Dr. ${doctorName}`);
    doc.moveDown(1);

    // Symptoms
    if (prescription.symptoms && prescription.symptoms.length > 0) {
      doc.fontSize(12).font("Helvetica-Bold").text("Symptoms:");
      doc.fontSize(10).font("Helvetica");
      prescription.symptoms.forEach((s: string) => doc.text(`  • ${s}`));
      doc.moveDown(0.5);
    }

    // Diagnosis
    if (prescription.diagnosis && prescription.diagnosis.length > 0) {
      doc.fontSize(12).font("Helvetica-Bold").text("Diagnosis:");
      doc.fontSize(10).font("Helvetica");
      prescription.diagnosis.forEach((d: string) => doc.text(`  • ${d}`));
      doc.moveDown(0.5);
    }

    // Medicines
    if (prescription.medicines && prescription.medicines.length > 0) {
      doc.fontSize(12).font("Helvetica-Bold").text("Medicines Prescribed:");
      doc.moveDown(0.3);

      // Table header
      const tableTop = doc.y;
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Medicine", 50, tableTop, { width: 120 });
      doc.text("Dose", 170, tableTop, { width: 60 });
      doc.text("Frequency", 230, tableTop, { width: 80 });
      doc.text("Duration", 310, tableTop, { width: 60 });
      doc.text("Instructions", 370, tableTop, { width: 175 });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.2);

      doc.fontSize(9).font("Helvetica");
      prescription.medicines.forEach((m: any) => {
        const y = doc.y;
        doc.text(m.name || "", 50, y, { width: 120 });
        doc.text(m.dose || "", 170, y, { width: 60 });
        doc.text(m.frequency || "", 230, y, { width: 80 });
        doc.text(m.duration || "", 310, y, { width: 60 });
        doc.text(m.instructions || "", 370, y, { width: 175 });
        doc.moveDown(0.5);
      });
      doc.moveDown(0.5);
    }

    // Lab Tests
    if (prescription.labTests && prescription.labTests.length > 0) {
      doc.fontSize(12).font("Helvetica-Bold").text("Recommended Lab Tests:");
      doc.fontSize(10).font("Helvetica");
      prescription.labTests.forEach((t: string) => doc.text(`  • ${t}`));
      doc.moveDown(0.5);
    }

    // Advice
    if (prescription.advice) {
      doc.fontSize(12).font("Helvetica-Bold").text("Advice:");
      doc.fontSize(10).font("Helvetica").text(prescription.advice);
      doc.moveDown(0.5);
    }

    // Follow-up
    if (prescription.followUpDate) {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(
          `Follow-up: ${new Date(prescription.followUpDate).toLocaleDateString()}`,
        );
    }

    // Footer
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#666")
      .text(
        "This is a computer-generated prescription and is valid without a signature.",
        { align: "center" },
      );

    doc.end();
  } catch (error) {
    next(error);
  }
}
