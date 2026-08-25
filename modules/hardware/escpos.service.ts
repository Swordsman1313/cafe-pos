export class ESCPOSBuilder {
  private buffer: number[] = [];

  private static readonly ESC = 0x1b;
  private static readonly GS = 0x1d;
  private static readonly LF = 0x0a;

  constructor() {
    this.init();
  }

  public init(): this {
    this.buffer.push(ESCPOSBuilder.ESC, 0x40); // ESC @
    return this;
  }

  public align(align: "left" | "center" | "right"): this {
    const val = align === "center" ? 1 : align === "right" ? 2 : 0;
    this.buffer.push(ESCPOSBuilder.ESC, 0x61, val);
    return this;
  }

  public bold(enable = true): this {
    this.buffer.push(ESCPOSBuilder.ESC, 0x45, enable ? 1 : 0);
    return this;
  }

  public size(w = 1, h = 1): this {
    const n = ((Math.min(w - 1, 7) & 0x07) << 4) | (Math.min(h - 1, 7) & 0x07);
    this.buffer.push(ESCPOSBuilder.GS, 0x21, n);
    return this;
  }

  public text(str: string): this {
    const bytes = Buffer.from(str, "utf-8");
    for (const b of bytes) this.buffer.push(b);
    return this;
  }

  public line(str = ""): this {
    if (str) this.text(str);
    this.buffer.push(ESCPOSBuilder.LF);
    return this;
  }

  public kickDrawer(): this {
    this.buffer.push(ESCPOSBuilder.ESC, 0x70, 0x00, 25, 250); // ESC p 0 25 250
    return this;
  }

  public qrCode(content: string, size = 6): this {
    const bytes = Buffer.from(content, "utf-8");
    const len = bytes.length + 3;
    this.buffer.push(ESCPOSBuilder.GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    this.buffer.push(ESCPOSBuilder.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size);
    this.buffer.push(ESCPOSBuilder.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 49);
    this.buffer.push(ESCPOSBuilder.GS, 0x28, 0x6b, len % 256, Math.floor(len / 256), 0x31, 0x50, 0x30, ...bytes);
    this.buffer.push(ESCPOSBuilder.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    return this;
  }

  public cut(): this {
    this.buffer.push(ESCPOSBuilder.LF, ESCPOSBuilder.LF, ESCPOSBuilder.LF);
    this.buffer.push(ESCPOSBuilder.GS, 0x56, 0x00); // GS V 0
    return this;
  }

  public toBuffer(): Buffer {
    return Buffer.from(this.buffer);
  }
}

export class ESCPOSService {
  public static generateReceiptBuffer(order: any, store: any): Buffer {
    const builder = new ESCPOSBuilder();

    builder
      .kickDrawer()
      .align("center")
      .bold(true)
      .size(2, 2)
      .line(store.name || "ARTISAN ROAST CAFE")
      .size(1, 1)
      .bold(false)
      .line(store.address || "Street 302, BKK1, Phnom Penh")
      .line(`Tel: ${store.phone || "+855 23 888 999"}`)
      .line("------------------------------------------")
      .align("left")
      .bold(true)
      .line(`TICKET #${order.ticketNumber}  [${order.channel}]`)
      .bold(false)
      .line(`Invoice: ${order.invoiceNumber}`)
      .line(`Date: ${new Date(order.createdAt).toLocaleString()}`)
      .line("------------------------------------------");

    for (const item of order.items) {
      builder.bold(true).line(`${item.quantity}x ${item.productName.padEnd(28)} $${item.totalPrice.toFixed(2)}`);
      if (item.modifiers && item.modifiers.length > 0) {
        const modStr = item.modifiers.map((m: any) => `${m.groupName}: ${m.optionName}`).join(" | ");
        builder.bold(false).line(`   ${modStr}`);
      }
      if (item.notes) {
        builder.bold(false).line(`   Note: ${item.notes}`);
      }
    }

    builder
      .line("------------------------------------------")
      .align("right")
      .line(`Subtotal: $${order.subtotal.toFixed(2)}`)
      .line(`Tax (10%): $${order.tax.toFixed(2)}`)
      .bold(true)
      .size(1, 2)
      .line(`TOTAL: $${order.total.toFixed(2)}`)
      .size(1, 1)
      .line(`KHR: ${(order.total * (store.khrRate || 4000)).toLocaleString()} KHR`)
      .bold(false)
      .line("------------------------------------------")
      .align("center")
      .line(store.receiptFooter || "Thank you for visiting!")
      .cut();

    return builder.toBuffer();
  }

  public static generateKOTBuffer(order: any, station = "BARISTA"): Buffer {
    const builder = new ESCPOSBuilder();

    const filteredItems = order.items.filter(
      (item: any) => !item.station || item.station === station || station === "ALL"
    );

    builder
      .align("center")
      .bold(true)
      .size(2, 2)
      .line(`KITCHEN ORDER: ${station}`)
      .size(2, 2)
      .line(`TICKET #${order.ticketNumber}`)
      .size(1, 1)
      .bold(false)
      .line(`Type: ${order.channel} | Table: ${order.tableNumber || "N/A"}`)
      .line(`Time: ${new Date().toLocaleTimeString()}`)
      .line("==========================================")
      .align("left");

    for (const item of filteredItems) {
      builder.bold(true).size(1, 2).line(`${item.quantity}x ${item.productName}`);
      builder.size(1, 1).bold(false);
      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          builder.line(`   * ${mod.groupName}: ${mod.optionName}`);
        }
      }
      if (item.notes) {
        builder.bold(true).line(`   ⚠️ NOTE: ${item.notes}`).bold(false);
      }
      builder.line("");
    }

    builder.cut();
    return builder.toBuffer();
  }
}
