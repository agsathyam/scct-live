export class SimpleZip {
  private files: { name: string, data: Uint8Array }[] = [];

  constructor() { }

  public addFile(name: string, data: Uint8Array) {
    this.files.push({ name, data });
  }

  public generate(): Uint8Array {
    const parts: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    // Helper to write number as little-endian bytes
    const write2 = (num: number) => {
      return new Uint8Array([num & 0xff, (num >> 8) & 0xff]);
    };
    const write4 = (num: number) => {
      return new Uint8Array([num & 0xff, (num >> 8) & 0xff, (num >> 16) & 0xff, (num >> 24) & 0xff]);
    };
    const writeStr = (str: string) => {
      const arr = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
      return arr;
    };

    // CRC32 Table
    const crcTable = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      crcTable[i] = c;
    }
    const crc32 = (data: Uint8Array) => {
      let crc = 0 ^ (-1);
      for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
      return (crc ^ (-1)) >>> 0;
    };

    for (const file of this.files) {
      const nameBytes = writeStr(file.name);
      const crc = crc32(file.data);
      const len = file.data.length;

      // 1. Local File Header
      // Signature (4) + Version (2) + Flags (2) + Compression (2) + Time (2) + Date (2) + CRC32 (4) + CompLen (4) + UncompLen (4) + NameLen (2) + ExtraLen (2)
      const header = new Uint8Array(30 + nameBytes.length);
      header.set(write4(0x04034b50), 0); // Sig
      header.set(write2(20), 4); // Ver
      header.set(write2(0), 6); // Flags
      header.set(write2(0), 8); // Compression (0 = Store)
      header.set(write4(0), 10); // Time/Date (Zeroed for simplicity)
      header.set(write4(crc), 14);
      header.set(write4(len), 18);
      header.set(write4(len), 22);
      header.set(write2(nameBytes.length), 26);
      header.set(write2(0), 28); // Extra len
      header.set(nameBytes, 30);

      parts.push(header);
      parts.push(file.data);

      // Add to Central Directory
      // Sig (4) + VerMade (2) + VerExt (2) + Flags (2) + Comp (2) + Time (2) + Date (2) + CRC (4) + CompLen (4) + UncompLen (4) + NameLen (2) + ExtraLen (2) + CommentLen (2) + DiskStart (2) + AttrInt (2) + AttrExt (4) + Offset (4)
      const cd = new Uint8Array(46 + nameBytes.length);
      cd.set(write4(0x02014b50), 0); // Sig
      cd.set(write2(20), 4); // Ver Made
      cd.set(write2(20), 6); // Ver Ext
      cd.set(write2(0), 8);
      cd.set(write2(0), 10); // Comp (0)
      cd.set(write4(0), 12); // Time/Date
      cd.set(write4(crc), 16);
      cd.set(write4(len), 20);
      cd.set(write4(len), 24);
      cd.set(write2(nameBytes.length), 28);
      cd.set(write2(0), 30); // Extra
      cd.set(write2(0), 32); // Comment
      cd.set(write2(0), 34); // Disk
      cd.set(write2(0), 36); // Attr Int
      cd.set(write4(0), 38); // Attr Ext
      cd.set(write4(offset), 42); // Offset
      cd.set(nameBytes, 46);

      centralDirectory.push(cd);

      offset += header.length + len;
    }

    const cdStart = offset;
    let cdLen = 0;
    for (const cd of centralDirectory) {
      parts.push(cd);
      cdLen += cd.length;
    }

    // End of Central Directory Record
    // Sig (4) + Disk (2) + DiskStart (2) + NumCD (2) + TotalCD (2) + SizeCD (4) + OffsetCD (4) + CommentLen (2)
    const eocd = new Uint8Array(22);
    eocd.set(write4(0x06054b50), 0);
    eocd.set(write2(0), 4);
    eocd.set(write2(0), 6);
    eocd.set(write2(this.files.length), 8);
    eocd.set(write2(this.files.length), 10);
    eocd.set(write4(cdLen), 12);
    eocd.set(write4(cdStart), 16);
    eocd.set(write2(0), 20); // Comment Len

    parts.push(eocd);

    // Concat all
    const totalSize = parts.reduce((acc, part) => acc + part.length, 0);
    const finalZip = new Uint8Array(totalSize);
    let pos = 0;
    for (const part of parts) {
      finalZip.set(part, pos);
      pos += part.length;
    }

    return finalZip;
  }
}
