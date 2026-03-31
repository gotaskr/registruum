import { NextResponse } from "next/server";
import { getArchivedWorkOrderDetails } from "@/features/archive/api/archive";
import { formatWorkOrderLocation } from "@/lib/utils";

type ArchiveExportRouteProps = Readonly<{
  params: Promise<{
    archivedWorkOrderId: string;
  }>;
}>;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toExportFileName(title: string) {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "archived-work-order";
}

function readValue(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "Not recorded";
}

function buildExportReference(input: Readonly<{
  archivedWorkOrderId: string;
  workOrderId: string;
  logIds: string[];
}>) {
  const source = `${input.archivedWorkOrderId}:${input.workOrderId}:${input.logIds.join("|")}`;
  let hash = 5381;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 33) ^ source.charCodeAt(index);
  }

  return `ARC-${Math.abs(hash >>> 0).toString(16).toUpperCase()}`;
}

function buildCell(value: string, styleId = "DataCell") {
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function buildMergedRow(value: string, mergeAcross: number, styleId = "SectionTitle") {
  return `<Row>${`<Cell ss:MergeAcross="${mergeAcross}" ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`}</Row>`;
}

function buildWorksheet(input: Readonly<{
  name: string;
  columnWidths: number[];
  rows: string[];
}>) {
  const columns = input.columnWidths
    .map((width) => `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`)
    .join("");

  return `
    <Worksheet ss:Name="${escapeXml(input.name)}">
      <Table>
        ${columns}
        ${input.rows.join("")}
      </Table>
    </Worksheet>
  `;
}

function buildWorkbook(worksheets: string[]) {
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40"
>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Top"/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0F172A"/>
      <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
      <Borders/>
    </Style>
    <Style ss:ID="ReportTitle">
      <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#0F172A"/>
      <Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/>
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="SectionTitle">
      <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#0F172A"/>
      <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="LabelCell">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#334155"/>
      <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9E2EC"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9E2EC"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9E2EC"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9E2EC"/>
      </Borders>
    </Style>
    <Style ss:ID="DataCell">
      <Alignment ss:Vertical="Top" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
    <Style ss:ID="ColumnHeader">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
      </Borders>
    </Style>
  </Styles>
  ${worksheets.join("")}
</Workbook>`;
}

export async function GET(
  _request: Request,
  { params }: ArchiveExportRouteProps,
) {
  try {
    const { archivedWorkOrderId } = await params;
    const details = await getArchivedWorkOrderDetails(archivedWorkOrderId);

    if (!details) {
      return NextResponse.json(
        { error: "Archived work order not found." },
        { status: 404 },
      );
    }

    const location = formatWorkOrderLocation(
      details.workOrder.locationLabel,
      details.workOrder.unitLabel,
    );
    const exportReference = buildExportReference({
      archivedWorkOrderId,
      workOrderId: details.workOrder.id,
      logIds: details.logs.map((log) => log.id),
    });
    const generatedAt = new Date().toLocaleString();
    const nonPhotoDocuments = details.documents.filter((document) => document.kind !== "photo");

    const summaryRows = [
      buildMergedRow(`${details.workOrder.title} Archive Audit Export`, 1, "ReportTitle"),
      `<Row>${buildCell("Export Reference", "LabelCell")}${buildCell(exportReference)}</Row>`,
      `<Row>${buildCell("Generated", "LabelCell")}${buildCell(generatedAt)}</Row>`,
      `<Row/>`,
      buildMergedRow("Archive Summary", 1),
      `<Row>${buildCell("Work Order", "LabelCell")}${buildCell(details.workOrder.title)}</Row>`,
      `<Row>${buildCell("Space", "LabelCell")}${buildCell(details.spaceName)}</Row>`,
      `<Row>${buildCell("Folder", "LabelCell")}${buildCell(details.folderName)}</Row>`,
      `<Row>${buildCell("Archived Date", "LabelCell")}${buildCell(details.archivedAtLabel)}</Row>`,
      `<Row>${buildCell("Archived By", "LabelCell")}${buildCell(details.archivedByName)}</Row>`,
      `<Row>${buildCell("Status", "LabelCell")}${buildCell(details.workOrder.status)}</Row>`,
      `<Row>${buildCell("Priority", "LabelCell")}${buildCell(details.workOrder.priority)}</Row>`,
      `<Row>${buildCell("Location", "LabelCell")}${buildCell(readValue(location))}</Row>`,
      `<Row>${buildCell("Description", "LabelCell")}${buildCell(readValue(details.workOrder.description))}</Row>`,
      `<Row>${buildCell("Start Date", "LabelCell")}${buildCell(readValue(details.workOrder.startDate))}</Row>`,
      `<Row>${buildCell("Due Date", "LabelCell")}${buildCell(readValue(details.workOrder.dueDate))}</Row>`,
      `<Row>${buildCell("Documents", "LabelCell")}${buildCell(String(details.documents.length))}</Row>`,
      `<Row>${buildCell("Photos", "LabelCell")}${buildCell(String(details.overview.photos.length))}</Row>`,
      `<Row>${buildCell("Logs", "LabelCell")}${buildCell(String(details.logs.length))}</Row>`,
    ];

    const fileRows = [
      buildMergedRow("Files And Photos", 5, "ReportTitle"),
      `<Row>${buildCell("Category", "ColumnHeader")}${buildCell("File Name", "ColumnHeader")}${buildCell("Folder", "ColumnHeader")}${buildCell("Uploaded By", "ColumnHeader")}${buildCell("Uploaded At", "ColumnHeader")}${buildCell("Notes", "ColumnHeader")}</Row>`,
      ...(nonPhotoDocuments.length > 0
        ? nonPhotoDocuments.map(
            (document) =>
              `<Row>${buildCell("File")}${buildCell(document.fileName || document.title)}${buildCell(document.systemFolderKey)}${buildCell(document.uploadedByName)}${buildCell(document.sentAt)}${buildCell(document.title)}</Row>`,
          )
        : [
            `<Row>${buildCell("File")}${buildCell("No files uploaded")}${buildCell("")}${buildCell("")}${buildCell("")}${buildCell("")}</Row>`,
          ]),
      ...(details.overview.photos.length > 0
        ? details.overview.photos.map(
            (photo) =>
              `<Row>${buildCell("Photo")}${buildCell(photo.title)}${buildCell("Photos")}${buildCell("")}${buildCell("")}${buildCell("Photo file name only for audit export")}</Row>`,
          )
        : [
            `<Row>${buildCell("Photo")}${buildCell("No photos uploaded")}${buildCell("")}${buildCell("")}${buildCell("")}${buildCell("")}</Row>`,
          ]),
    ];

    const logRows = [
      buildMergedRow("Audit Log", 5, "ReportTitle"),
      `<Row>${buildCell("Timestamp", "ColumnHeader")}${buildCell("Actor", "ColumnHeader")}${buildCell("Action", "ColumnHeader")}${buildCell("Details", "ColumnHeader")}${buildCell("Before", "ColumnHeader")}${buildCell("After", "ColumnHeader")}</Row>`,
      ...(details.logs.length > 0
        ? details.logs.map((log) => {
            const timestamp = log.rawCreatedAt ?? log.createdAt;

            return `<Row>${buildCell(timestamp)}${buildCell(log.actorName)}${buildCell(log.action)}${buildCell(log.details ?? "Not recorded")}${buildCell(log.change?.before ?? "")}${buildCell(log.change?.after ?? "")}</Row>`;
          })
        : [
            `<Row>${buildCell("No logs recorded")}${buildCell("")}${buildCell("")}${buildCell("")}${buildCell("")}${buildCell("")}</Row>`,
          ]),
    ];

    const workbook = buildWorkbook([
      buildWorksheet({
        name: "Summary",
        columnWidths: [180, 420],
        rows: summaryRows,
      }),
      buildWorksheet({
        name: "Files and Photos",
        columnWidths: [90, 260, 120, 160, 160, 280],
        rows: fileRows,
      }),
      buildWorksheet({
        name: "Logs",
        columnWidths: [180, 140, 220, 320, 180, 180],
        rows: logRows,
      }),
    ]);
    const fileName = `${toExportFileName(details.workOrder.title)}-archive-audit.xls`;

    return new NextResponse(workbook, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to export archived work order.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
