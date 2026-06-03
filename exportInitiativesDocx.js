/* exportInitiativesDocx.js — generate a formatted Initiative Update Report (.docx)
   from the live initiatives array, then download it. No bundler: relies on the
   `docx` UMD global (window.docx) loaded via <script> in index.html, and attaches
   two helpers to window. Layout mirrors Initiative_Update_Template.docx. */

(function () {
  // ---- palette (hex, no leading #) ----
  const NAVY = "1B3A6B";       // headings / header rule
  const NAVY2 = "2D5AA0";      // sub-headers + lettered prefixes
  const GREY = "6B7280";       // muted / placeholder text
  const LABEL = "374151";      // metadata labels
  const INK = "1F2937";        // body text
  const RULE = "D1D5DB";       // light grey footer rule
  const SHADE = "F4F6FA";      // alt row / light box bg
  const WHITE = "FFFFFF";

  // status badge colours (text on fill) — keyed by Periscope status values
  function badge(status) {
    switch (status) {
      case "on-track": return { label: "On Track",        text: "1A7A4A", fill: "E6F4ED" };
      case "at-risk":  return { label: "Needs Attention",  text: "92610A", fill: "FEF9C3" };
      case "blocked":  return { label: "Blocked",          text: "B91C1C", fill: "FEE2E2" };
      case "done":     return { label: "Completed",        text: "1E40AF", fill: "DBEAFE" };
      case "todo":     return { label: "To Do",            text: "4E5760", fill: "ECEEF0" };
      default:         return { label: status || "—",      text: LABEL,    fill: SHADE };
    }
  }

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function fmtDue(due) {
    if (!due) return null;
    const d = new Date(due + "T00:00:00");
    if (isNaN(d)) return null;
    return String(d.getDate()).padStart(2, "0") + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  // ---- column widths (DXA) — must sum to 9746 (A4 minus 2×1080 margins) ----
  const CONTENT_W = 9746;
  const DETAIL_COLS = [500, 2200, 1200, 1100, 4746]; // #, Initiative, Status, Due, Update
  const CELL_MARGIN = { top: 80, bottom: 80, left: 120, right: 120 };

  function makeDoc(inits) {
    const D = window.docx;
    const {
      Document, Paragraph, TextRun, Table, TableRow, TableCell,
      WidthType, BorderStyle, ShadingType, AlignmentType,
      Header, Footer, PageNumber, VerticalAlign, TabStopType,
    } = D;

    const NONE = { style: BorderStyle.NONE, size: 0, color: WHITE };
    const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE,
      insideHorizontal: NONE, insideVertical: NONE };

    // ---- small builders ----
    function run(text, opts) { return new TextRun(Object.assign({ text, font: "Arial" }, opts || {})); }
    function para(children, opts) {
      return new Paragraph(Object.assign({ children: Array.isArray(children) ? children : [children] }, opts || {}));
    }
    function shade(fill) { return { type: ShadingType.CLEAR, color: "auto", fill }; }

    function cell(children, opts) {
      opts = opts || {};
      return new TableCell({
        width: { size: opts.width, type: WidthType.DXA },
        shading: opts.fill ? shade(opts.fill) : undefined,
        borders: opts.borders || noBorders,
        margins: opts.margins || CELL_MARGIN,
        verticalAlign: opts.valign || VerticalAlign.CENTER,
        columnSpan: opts.span,
        children: Array.isArray(children) ? children : [children],
      });
    }

    // lettered list item: "a.  " bold navy prefix + text
    function letterItem(idx, text, placeholder) {
      return para([
        run(String.fromCharCode(97 + idx) + ".  ", { bold: true, color: NAVY2, size: 18 }),
        run(text, { color: placeholder ? GREY : INK, size: 18, italics: !!placeholder }),
      ], { spacing: { after: 30 } });
    }

    // caps section label
    function sectionLabel(text, opts) {
      return para(run(text, { bold: true, color: NAVY, size: 18, allCaps: true }),
        Object.assign({ spacing: { before: 240, after: 100 } }, opts || {}));
    }

    // ---- header (every page): title left, CONFIDENTIAL right, navy bottom rule ----
    const header = new Header({
      children: [para([
        run("Initiative Update Report", { bold: true, color: NAVY, size: 18 }),
        run("\t", {}),
        run("CONFIDENTIAL", { color: GREY, size: 16, allCaps: true }),
      ], {
        tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
        border: { bottom: { color: NAVY, style: BorderStyle.SINGLE, size: 8, space: 4 } },
      })],
    });

    // ---- footer (every page): team placeholder left, Page X of Y right, grey top rule ----
    const footer = new Footer({
      children: [para([
        run("[System / Team Name]", { italics: true, color: GREY, size: 16 }),
        run("\t", {}),
        run("Page ", { color: GREY, size: 16 }),
        new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 16, font: "Arial" }),
        run(" of ", { color: GREY, size: 16 }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], color: GREY, size: 16, font: "Arial" }),
      ], {
        tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
        border: { top: { color: RULE, style: BorderStyle.SINGLE, size: 6, space: 4 } },
      })],
    });

    // ================= BODY =================
    const body = [];

    // ---- title block ----
    body.push(para(run("Initiative Update", { bold: true, color: NAVY, size: 40 }),
      { spacing: { after: 40 } }));
    body.push(para(run("Reporting period & system summary", { italics: true, color: GREY, size: 20 }),
      { spacing: { after: 120 }, border: { bottom: { color: RULE, style: BorderStyle.SINGLE, size: 6, space: 6 } } }));

    // ---- report details (label/value, borderless) ----
    body.push(sectionLabel("Report Details", { spacing: { before: 200, after: 100 } }));
    const detailRows = [
      ["Report Date", "{Today's Date}"],
      ["Reporting Period", "{e.g. Q2 2026 — Week 3}"],
      ["System / Source", "{System name or data source}"],
      ["Prepared By", "{Name / Team}"],
      ["Distribution", "{Stakeholders / Slack channel}"],
    ];
    body.push(new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [2729, 7017],
      borders: noBorders,
      rows: detailRows.map(([k, v]) => new TableRow({
        children: [
          cell(para(run(k, { bold: true, color: LABEL, size: 18 })), { width: 2729, fill: SHADE }),
          cell(para(run(v, { italics: true, color: GREY, size: 18 })), { width: 7017, fill: WHITE }),
        ],
      })),
    }));

    // ---- summary stats (4 coloured boxes) ----
    const counts = {
      total: inits.length,
      onTrack: inits.filter(i => i.status === "on-track").length,
      // spec: combine "Needs Attention" + "Delayed"; Periscope only has at-risk
      needs: inits.filter(i => i.status === "at-risk").length,
      done: inits.filter(i => i.status === "done").length,
    };
    const boxes = [
      { n: counts.total,   label: "Total Initiatives", text: NAVY,     fill: SHADE },
      { n: counts.onTrack, label: "On Track",          text: "1A7A4A", fill: "E6F4ED" },
      { n: counts.needs,   label: "Needs Attention",   text: "92610A", fill: "FEF9C3" },
      { n: counts.done,    label: "Completed",         text: "1E40AF", fill: "DBEAFE" },
    ];
    // white gridlines between boxes to read as separated cards
    const boxBorder = {
      top: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
      left: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
      right: { style: BorderStyle.SINGLE, size: 12, color: WHITE },
    };
    body.push(sectionLabel("Summary"));
    body.push(new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [2437, 2437, 2436, 2436],
      borders: noBorders,
      rows: [new TableRow({
        children: boxes.map((b, idx) => cell([
          para(run(String(b.n), { bold: true, color: b.text, size: 44 }), { alignment: AlignmentType.CENTER, spacing: { after: 20 } }),
          para(run(b.label, { color: b.text, size: 16 }), { alignment: AlignmentType.CENTER }),
        ], {
          width: idx < 2 ? 2437 : 2436,
          fill: b.fill,
          borders: boxBorder,
          margins: { top: 160, bottom: 160, left: 80, right: 80 },
        })),
      })],
    }));

    // ---- initiative details table ----
    body.push(sectionLabel("Initiative Details"));

    const headerCellBorders = {
      top: NONE, left: NONE, right: NONE,
      bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY },
    };
    function headCell(text, w, align) {
      return cell(para(run(text, { bold: true, color: WHITE, size: 18 }),
        { alignment: align || AlignmentType.LEFT }),
        { width: w, fill: NAVY, borders: headerCellBorders });
    }
    const detailHeader = new TableRow({
      tableHeader: true,
      children: [
        headCell("#", DETAIL_COLS[0], AlignmentType.CENTER),
        headCell("Initiative", DETAIL_COLS[1]),
        headCell("Status", DETAIL_COLS[2], AlignmentType.CENTER),
        headCell("Due Date", DETAIL_COLS[3]),
        headCell("Update", DETAIL_COLS[4]),
      ],
    });

    function updateCellChildren(init) {
      const kids = [];
      // 1. description (objective) — placeholder if empty
      const hasObj = init.objective && init.objective.trim();
      kids.push(para(run(hasObj ? init.objective.trim() : "[Brief description of what this initiative is about]",
        { color: hasObj ? INK : GREY, size: 18, italics: !hasObj }), { spacing: { after: 60 } }));
      // 2. Completed sub-header
      kids.push(para(run("Completed", { bold: true, color: NAVY2, size: 18 }), { spacing: { after: 20 } }));
      // 3. lettered completed items
      const completed = Array.isArray(init.completed) ? init.completed : [];
      if (completed.length) completed.forEach((c, i) => kids.push(letterItem(i, c)));
      else kids.push(para(run("[No items logged yet]", { italics: true, color: GREY, size: 18 }), { spacing: { after: 30 } }));
      // 4. spacer
      kids.push(para(run("", { size: 10 })));
      // 5. Next Steps sub-header
      kids.push(para(run("Next Steps", { bold: true, color: NAVY2, size: 18 }), { spacing: { after: 20 } }));
      // 6. lettered next items
      const next = Array.isArray(init.next) ? init.next : [];
      if (next.length) next.forEach((c, i) => kids.push(letterItem(i, c)));
      else kids.push(para(run("[No next steps yet]", { italics: true, color: GREY, size: 18 })));
      return kids;
    }

    const detailRowsBody = inits.map((init, i) => {
      const rowFill = (i % 2 === 0) ? WHITE : SHADE; // even (0-based) → white, odd → grey
      const b = badge(init.status);
      const due = fmtDue(init.due);
      return new TableRow({
        children: [
          cell(para(run(String(i + 1), { color: INK, size: 18 }), { alignment: AlignmentType.CENTER }),
            { width: DETAIL_COLS[0], fill: rowFill, valign: VerticalAlign.TOP }),
          cell(para(run(init.name, { bold: true, color: INK, size: 18 })),
            { width: DETAIL_COLS[1], fill: rowFill, valign: VerticalAlign.TOP }),
          // status badge: own colours regardless of row shade
          cell(para(run(b.label, { bold: true, color: b.text, size: 18 }), { alignment: AlignmentType.CENTER }),
            { width: DETAIL_COLS[2], fill: b.fill, valign: VerticalAlign.TOP }),
          cell(para(run(due || "[DD MMM YYYY]", { color: due ? INK : GREY, size: 18, italics: !due })),
            { width: DETAIL_COLS[3], fill: rowFill, valign: VerticalAlign.TOP }),
          cell(updateCellChildren(init),
            { width: DETAIL_COLS[4], fill: rowFill, valign: VerticalAlign.TOP }),
        ],
      });
    });

    body.push(new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: DETAIL_COLS,
      borders: noBorders,
      rows: [detailHeader].concat(detailRowsBody),
    }));

    // ---- notes & escalations ----
    body.push(para(run("", { size: 8 }), {
      spacing: { before: 200, after: 60 },
      border: { top: { color: RULE, style: BorderStyle.SINGLE, size: 6, space: 6 } },
    }));
    body.push(para(run("Notes & Escalations", { bold: true, color: NAVY, size: 18, allCaps: true }),
      { spacing: { after: 60 } }));
    body.push(para(run("Use this section for items requiring stakeholder attention, decisions, or cross-team alignment.",
      { italics: true, color: GREY, size: 18 }), { spacing: { after: 80 } }));
    body.push(letterItem(0, "[Escalation or note 1 — include context and desired action]", true));
    body.push(letterItem(1, "[Escalation or note 2]", true));

    return new Document({
      styles: { default: { document: { run: { font: "Arial", size: 18, color: INK } } } },
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 in twip
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: body,
      }],
    });
  }

  // Public: build the report and resolve to a Blob.
  window.exportInitiativesDocx = function (inits) {
    if (!window.docx) return Promise.reject(new Error("docx library not loaded"));
    const doc = makeDoc(Array.isArray(inits) ? inits : []);
    return window.docx.Packer.toBlob(doc);
  };

  // Public: download a Blob — native save dialog in Tauri, anchor download in browser.
  window.downloadDocxBlob = async function (blob, filename) {
    const T = window.__TAURI__;
    if (T && T.dialog && T.fs) {
      const path = await T.dialog.save({
        defaultPath: filename,
        filters: [{ name: "Word Document", extensions: ["docx"] }],
      });
      if (!path) return; // user cancelled
      const buf = new Uint8Array(await blob.arrayBuffer());
      await T.fs.writeFile(path, buf);
      return;
    }
    // browser fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
})();
