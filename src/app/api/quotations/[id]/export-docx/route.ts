import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  Footer,
} from "docx";

// كل فقرة عربية لازم تبقى bidirectional عشان تتظبط RTL صح في Word
function rtlPara(children: any[], opts: any = {}) {
  return new Paragraph({ ...opts, bidirectional: true, children });
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; type: "png" | "jpg" } | null {
  const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const type = match[1] === "jpeg" ? "jpg" : (match[1] as "png" | "jpg");
  return { buffer: Buffer.from(match[2], "base64"), type };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quotation = await prisma.quotation.findUnique({
    where: { id: params.id },
    include: { client: true, items: { orderBy: { createdAt: "asc" } } },
  });
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const company = await prisma.companyProfile.findUnique({ where: { id: "singleton" } });

  const total = quotation.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
  const fmtNum = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const fmtDate = (d: Date) => d.toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" });

  // ---- الشعار أعلى الشمال ----
  const headerChildren: any[] = [];
  if (company?.logoUrl) {
    const img = dataUrlToBuffer(company.logoUrl);
    if (img) {
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new ImageRun({ data: img.buffer, type: img.type, transformation: { width: 440, height: 440 } })],
        })
      );
    }
  }

  const headerTableWidths = [6300, 3240]; // اللوجو | رقم العرض والتاريخ
  const headerTable = new Table({
    columnWidths: headerTableWidths,
    width: { size: 9540, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: headerTableWidths[1], type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              rtlPara([new TextRun({ text: `رقم العرض: ${quotation.quotationNumber}`, bold: true, size: 20 })], { alignment: AlignmentType.RIGHT }),
              rtlPara([new TextRun({ text: fmtDate(quotation.date), size: 16, color: "888888" })], { alignment: AlignmentType.RIGHT }),
            ],
          }),
          new TableCell({
            width: { size: headerTableWidths[0], type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            children:
              headerChildren.length > 0
                ? headerChildren
                : [rtlPara([new TextRun({ text: company?.name ?? "Section General Contracting", bold: true, size: 26, color: "C9692E" })], { alignment: AlignmentType.CENTER })],
          }),
        ],
      }),
    ],
  });

  // ---- بنود عرض السعر كجدول ----
  const colWidths = [700, 4200, 900, 1200, 1400, 1600]; // م | الوصف | الوحدة | الكمية | السعر | الإجمالي
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  function headerCell(text: string, width: number) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: "2C2E30" },
      verticalAlign: VerticalAlign.CENTER,
      children: [rtlPara([new TextRun({ text, bold: true, color: "FFFFFF", size: 20 })], { alignment: AlignmentType.CENTER })],
    });
  }
  function dataCell(text: string, width: number, alignRight = false) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      children: [rtlPara([new TextRun({ text, size: 20 })], { alignment: alignRight ? AlignmentType.RIGHT : AlignmentType.CENTER })],
    });
  }

  const itemRows = quotation.items.map(
    (item, idx) =>
      new TableRow({
        children: [
          dataCell(String(idx + 1), colWidths[0]),
          dataCell(item.description, colWidths[1], true),
          dataCell(item.unit, colWidths[2]),
          dataCell(fmtNum(Number(item.quantity)), colWidths[3]),
          dataCell(fmtNum(Number(item.unitPrice)), colWidths[4]),
          dataCell(fmtNum(Number(item.quantity) * Number(item.unitPrice)), colWidths[5]),
        ],
      })
  );

  const totalRow = new TableRow({
    children: [
      new TableCell({
        width: { size: colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], type: WidthType.DXA },
        columnSpan: 5,
        shading: { type: ShadingType.CLEAR, color: "auto", fill: "F3F3F3" },
        children: [rtlPara([new TextRun({ text: "الإجمالي", bold: true, size: 22 })], { alignment: AlignmentType.RIGHT })],
      }),
      new TableCell({
        width: { size: colWidths[5], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: "auto", fill: "F3F3F3" },
        children: [rtlPara([new TextRun({ text: `${fmtNum(total)} ج.م`, bold: true, size: 22, color: "2E7D32" })], { alignment: AlignmentType.CENTER })],
      }),
    ],
  });

  const itemsTable = new Table({
    columnWidths: colWidths,
    width: { size: tableWidth, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          headerCell("م", colWidths[0]),
          headerCell("وصف البند", colWidths[1]),
          headerCell("الوحدة", colWidths[2]),
          headerCell("الكمية", colWidths[3]),
          headerCell("سعر الوحدة", colWidths[4]),
          headerCell("الإجمالي", colWidths[5]),
        ],
      }),
      ...itemRows,
      totalRow,
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 900, left: 720, right: 720 } }, // A4
        },
        footers: {
          default: new Footer({
            children: [
              rtlPara(
                [
                  new TextRun({ text: "www.section-eg.com   |   info@section-eg.com   |   03 5516692   |   01110444395", size: 16, color: "888888" }),
                ],
                { alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD", space: 8 } } }
              ),
            ],
          }),
        },
        children: [
          headerTable,
          rtlPara([new TextRun({ text: "عرض سعر", bold: true, size: 32 })], { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 300 } }),

          rtlPara(
            [new TextRun({ text: `السادة/ ${quotation.client.name}                                                     المحترمين،،،`, bold: true, size: 22 })],
            { alignment: AlignmentType.RIGHT, spacing: { after: 150 } }
          ),
          rtlPara(
            [new TextRun({ text: `تحية طيبة وبعد،`, size: 20 })],
            { alignment: AlignmentType.RIGHT, spacing: { after: 100 } }
          ),
          rtlPara(
            [new TextRun({ text: `يسرّنا أن نتقدّم لسيادتكم بعرض السعر الخاص بـ "${quotation.projectName}" كما هو موضّح بالتفصيل أدناه:`, size: 20 })],
            { alignment: AlignmentType.RIGHT, spacing: { after: 250 } }
          ),

          itemsTable,

          new Paragraph({ children: [], spacing: { after: 250 } }),
          rtlPara(
            [new TextRun({ text: "الأسعار لا تشمل ضريبة القيمة المضافة.", italics: true, size: 18, color: "990000" })],
            { alignment: AlignmentType.RIGHT, spacing: { after: 60 } }
          ),
          quotation.validUntil
            ? rtlPara(
                [new TextRun({ text: `العرض ساري حتى تاريخ ${fmtDate(quotation.validUntil)}.`, italics: true, size: 18, color: "666666" })],
                { alignment: AlignmentType.RIGHT, spacing: { after: 60 } }
              )
            : new Paragraph({ children: [] }),
          quotation.notes
            ? rtlPara([new TextRun({ text: quotation.notes, size: 18, color: "666666" })], { alignment: AlignmentType.RIGHT, spacing: { after: 200 } })
            : new Paragraph({ children: [] }),

          new Paragraph({ children: [], spacing: { after: 300 } }),
          rtlPara(
            [new TextRun({ text: "نأمل أن ينال عرضنا رضاكم", bold: true, size: 24 })],
            { alignment: AlignmentType.CENTER, spacing: { after: 100 } }
          ),
          rtlPara(
            [new TextRun({ text: "وتفضلوا بقبول فائق الاحترام والتقدير،،،", size: 20 })],
            { alignment: AlignmentType.CENTER, spacing: { after: 600 } }
          ),

          rtlPara([new TextRun({ text: "مدير المكتب الفني", bold: true, size: 20 })], { alignment: AlignmentType.LEFT }),
          rtlPara([new TextRun({ text: "م. اسماء محمود", size: 20 })], { alignment: AlignmentType.LEFT }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="quotation-${quotation.quotationNumber}.docx"`,
    },
  });
}
