export class SimplePDF {
  private objects: string[] = [];
  private pages: number[] = [];
  private buffer: string[] = [];
  private xrefOffsets: number[] = [];

  constructor() { }

  private addObject(content: string): number {
    this.objects.push(content);
    return this.objects.length;
  }

  public createPDF(title: string, textContent: string): Uint8Array {
    this.objects = [];
    this.pages = [];
    this.xrefOffsets = [];
    this.buffer = [];

    // Header
    this.buffer.push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

    // 1. Catalog
    const catalogId = 1;

    // 2. Page Tree
    const pageTreeId = 2;

    // 3. Font (Helvetica)
    const fontId = 3;
    const fontContent = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;

    // 4. Content Stream
    const formattedText = this.formatTextStream(title, textContent);
    const contentId = 4;
    const contentObj = `<< /Length ${formattedText.length} >>\nstream\n${formattedText}\nendstream`;

    // 5. Page
    const pageId = 5;
    this.pages.push(pageId);

    const pageContent = `<< /Type /Page /Parent ${pageTreeId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> /MediaBox [0 0 612 792] /Contents ${contentId} 0 R >>`;

    // --- WRITE OBJECTS ---

    // Obj 1: Catalog
    this.writeObj(catalogId, `<< /Type /Catalog /Pages ${pageTreeId} 0 R >>`);

    // Obj 2: Page Tree
    const kidsArray = `[${this.pages.map(pid => `${pid} 0 R`).join(' ')}]`;
    this.writeObj(pageTreeId, `<< /Type /Pages /Kids ${kidsArray} /Count ${this.pages.length} >>`);

    // Obj 3: Font
    this.writeObj(fontId, fontContent);

    // Obj 4: Stream
    this.writeObj(contentId, contentObj);

    // Obj 5: Page
    this.writeObj(pageId, pageContent);

    // --- XREF & TRAILER ---
    const xrefStart = this.currentOffset();
    this.buffer.push("xref\n");
    this.buffer.push(`0 ${this.objects.length + 1}\n`);
    this.buffer.push("0000000000 65535 f \n");

    for (const offset of this.xrefOffsets) {
      this.buffer.push(`${offset.toString().padStart(10, '0')} 00000 n \n`);
    }

    this.buffer.push("trailer\n");
    this.buffer.push(`<< /Size ${this.objects.length + 1} /Root ${catalogId} 0 R >>\n`);
    this.buffer.push("startxref\n");
    this.buffer.push(`${xrefStart}\n`);
    this.buffer.push("%%EOF\n");

    // Convert string buffer to Uint8Array
    const raw = this.buffer.join("");
    const data = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      data[i] = raw.charCodeAt(i);
    }
    return data;
  }

  private writeObj(id: number, content: string) {
    this.xrefOffsets.push(this.currentOffset());
    this.buffer.push(`${id} 0 obj\n${content}\nendobj\n`);
  }

  private currentOffset(): number {
    return this.buffer.join("").length;
  }

  private formatTextStream(title: string, text: string): string {
    const ops: string[] = [];
    ops.push("BT");

    // Title
    ops.push("/F1 18 Tf");
    ops.push("50 750 Td");
    ops.push(`(${this.escape(title)}) Tj`);

    // Body
    ops.push("/F1 11 Tf");
    ops.push("0 -24 Td");
    ops.push("14 TL");

    const lines = text.split('\n');
    for (const line of lines) {
      if (!line.trim()) {
        ops.push("T* T*"); // Double newline
        continue;
      }

      // Simple word wrap
      const words = line.split(' ');
      let currentLine = "";

      for (const word of words) {
        if ((currentLine + word).length > 85) { // Approx chars per line
          ops.push(`(${this.escape(currentLine.trim())}) Tj`);
          ops.push("T*");
          currentLine = word + " ";
        } else {
          currentLine += word + " ";
        }
      }
      if (currentLine) {
        ops.push(`(${this.escape(currentLine.trim())}) Tj`);
        ops.push("T*");
      }
    }

    ops.push("ET");
    return ops.join("\n");
  }

  private escape(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
}
