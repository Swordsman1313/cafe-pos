/**
 * ESC/POS Binary Byte Buffer Generator for 80mm Thermal Printers
 * Standard 48-column format for POS Receipt and Kitchen Order Tickets (KOT)
 */

export class ESCPOSBuilder {
  private buffer: number[] = [];

  // ---------------------------------------------------------------------------
  // ESC/POS Command Constants
  // ---------------------------------------------------------------------------
  private static readonly ESC = 0x1b;
  private static readonly GS = 0x1d;
  private static readonly LF = 0x0a;

  constructor() {
    this.init();
  }

  public init(): this {
    this.buffer.push(ESCPOSBuilder.ESC, 0x40); // ESC @ (Initialize printer)
    return this;
  }

  public align(alignment: "left" | "center" | "right"): this {
    const val = alignment === "center" ? 1 : alignment === "right" ? 2 : 0;
    this.buffer.push(ESCPOSBuilder.ESC, 0x61, val); // ESC a n
    return this;
  }

  public bold(enable = true): this {
    this.buffer.push(ESCPOSBuilder.ESC, 0x45, enable ? 1 : 0); // ESC E n
    return this;
  }

  public size(widthMultiplier = 1, heightMultiplier = 1): this {
    // GS ! n : 0x00 normal, 0x11 double width/height, 0x22 triple
    const w = Math.min(Math.max(widthMultiplier - 1, 0), 7);
    const h = Math.min(Math.max(heightMultiplier - 1, 0), 7);
    const n = (w << 4) | h;
    this.buffer.push(ESCPOSBuilder.GS, 0x21, n);
    return this;
  }

  public text(str: string): this {
    const bytes = Buffer.from(str, "utf-8");
    for (const b of bytes) {
      this.buffer.push(b);
    }
    return this;
  }

  public line(str = ""): this {
    if (str) {
      this.text(str);
    }
    this.buffer.push(ESCPOSBuilder.LF);
    return this;
  }

  public feed(lines = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(ESCPOSBuilder.LF);
    }
    return this;
  }

  public divider(char = "-", width = 48): this {
    return this.align("left").line(char.repeat(width));
  }

  public doubleDivider(width = 48): this {
    return this.divider("=", width);
  }

  /**
   * Formats a 2-column key-value row with standard 48-char width
   */
  public twoColumns(left: string, right: string, width = 48): this {
    const leftLen = Buffer.from(left, "utf-8").length;
    const rightLen = Buffer.from(right, "utf-8").length;
    const spaces = Math.max(1, width - leftLen - rightLen);
    return this.align("left").line(`${left}${" ".repeat(spaces)}${right}`);
  }

  /**
   * Formats a 3-column row: Item (26) | Qty (6) | Total (16)
   */
  public itemRow(name: string, qtyStr: string, priceStr: string, width = 48): this {
    const col1Width = 26;
    const col2Width = 6;
    const col3Width = width - col1Width - col2Width;

    const col1 = name.length > col1Width ? name.substring(0, col1Width - 1) + "…" : name.padEnd(col1Width);
    const col2 = qtyStr.padStart(col2Width);
    const col3 = priceStr.padStart(col3Width);

    return this.align("left").line(`${col1}${col2}${col3}`);
  }

  /**
   * Drawer kick pulse: ESC p m t1 t2
   * Pin 2: m=0, t1=25 (50ms pulse on), t2=250 (500ms pulse off)
   */
  public kickDrawer(): this {
    this.buffer.push(ESCPOSBuilder.ESC, 0x70, 0x00, 25, 250);
    return this;
  }

  /**
   * Paper Cut: GS V m
   * m = 0 (Full Cut), m = 1 (Partial Cut)
   */
  public cut(partial = false): this {
    this.feed(3);
    this.buffer.push(ESCPOSBuilder.GS, 0x56, partial ? 0x01 : 0x00);
    return this;
  }

  /**
   * QR Code Generation using standard GS ( k commands
   */
  public qrCode(content: string, size = 6): this {
    const bytes = Buffer.from(content, "utf-8");
    const len = bytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // Set model 2
    this.buffer.push(ESCPOSBuilder.GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // Set size
    this.buffer.push(ESCPOSBuilder.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size);
    // Set error correction level M (49)
    this.buffer.push(ESCPOSBuilder.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 49);
    // Store data in symbol storage area
    this.buffer.push(ESCPOSBuilder.GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...bytes);
    // Print QR code symbol
    this.buffer.push(ESCPOSBuilder.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    return this;
  }

  public toBuffer(): Buffer {
    return Buffer.from(this.buffer);
  }

  public toBase64(): string {
    return this.toBuffer().toString("base64");
  }

  public toHex(): string {
    return this.toBuffer().toString("hex");
  }
}

export class ESCPOSService {
  /**
   * Generates a complete 80mm Customer Thermal Bill Receipt
   */
  generateCustomerReceipt(order: any, store: any) {
    const builder = new ESCPOSBuilder();

    builder
      .kickDrawer() // Pulse cash drawer open
      .align("center")
      .size(2, 2)
      .bold(true)
      .line(store.name || "ARTISAN ROAST CAFÉ")
      .size(1, 1)
      .bold(false)
      .line(store.address || "Street 302, BKK1, Phnom Penh")
      .line(`Tel: ${store.phone || "+855 23 888 999"}`)
      .feed(1)
      .bold(true)
      .line("TAX INVOICE / RECEIPT")
      .bold(false)
      .feed(1)
      .divider()
      .twoColumns(`Invoice: ${order.invoiceNumber || order.id}`, `Ticket: #${order.ticketNumber || "---"}`)
      .twoColumns(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, `Time: ${new Date(order.createdAt).toLocaleTimeString()}`)
      .twoColumns(`Cashier: ${order.cashierName || "Staff"}`, `Channel: ${order.channel || "WALK_IN"}`)
      .divider()
      .itemRow("ITEM", "QTY", "TOTAL ($)")
      .divider();

    // Line Items
    for (const item of order.items) {
      builder.itemRow(item.productName || item.name, `x${item.quantity}`, `$${Number(item.totalPrice || item.total).toFixed(2)}`);

      // Modifiers subtext
      if (item.modifiers && item.modifiers.length > 0) {
        const modSummary = item.modifiers.map((m: any) => m.optionName).join(", ");
        builder.align("left").line(`  ↳ ${modSummary}`);
      }
    }

    const subtotal = Number(order.subtotal || 0).toFixed(2);
    const tax = Number(order.tax || 0).toFixed(2);
    const totalUSD = Number(order.total || 0).toFixed(2);
    const totalKHR = Math.round(order.total * (order.khrRate || 4000)).toLocaleString("en-US");

    builder
      .divider()
      .twoColumns("Subtotal:", `$${subtotal}`)
      .twoColumns("VAT (10%):", `$${tax}`)
      .doubleDivider()
      .bold(true)
      .size(1, 2)
      .twoColumns("TOTAL USD:", `$${totalUSD}`)
      .twoColumns("TOTAL KHR:", `${totalKHR} KHR`)
      .size(1, 1)
      .bold(false)
      .divider();

    // Payment Section
    if (order.payments && order.payments.length > 0) {
      const p = order.payments[0];
      builder
        .twoColumns("Payment Mode:", p.method)
        .twoColumns("Amount Paid:", `$${Number(p.amountUSD).toFixed(2)} (${p.amountKHR.toLocaleString()} KHR)`)
        .twoColumns("Change USD / KHR:", `$${Number(p.changeGivenUSD || 0).toFixed(2)} / ${(p.changeGivenKHR || 0).toLocaleString()} KHR`)
        .divider();
    }

    builder
      .feed(1)
      .align("center")
      .line(store.receiptFooter || "Thank you for visiting! Please come again.")
      .feed(1)
      .qrCode(`https://verify.artisanroast.com/inv/${order.invoiceNumber || order.id}`, 5)
      .feed(1)
      .line("Scan to verify electronic invoice")
      .cut();

    return {
      rawBuffer: builder.toBuffer(),
      base64: builder.toBase64(),
      hex: builder.toHex(),
    };
  }

  /**
   * Generates a Kitchen Order Ticket (KOT) with giant ticket numbering and modifier callouts
   */
  generateKitchenTicket(order: any) {
    const builder = new ESCPOSBuilder();

    builder
      .align("center")
      .size(2, 2)
      .bold(true)
      .line(`*** KITCHEN ORDER ***`)
      .feed(1)
      .size(3, 3)
      .line(`TICKET #${order.ticketNumber}`)
      .size(1, 1)
      .bold(false)
      .feed(1)
      .divider("=")
      .twoColumns(`Channel: [ ${order.channel || "WALK_IN"} ]`, `Time: ${new Date(order.createdAt).toLocaleTimeString()}`)
      if (order.tableNumber) {
        builder.align("left").bold(true).line(`Table: ${order.tableNumber}`).bold(false);
      }
      builder
        .divider("=")
        .feed(1);

    for (const item of order.items) {
      builder
        .align("left")
        .bold(true)
        .size(2, 2)
        .line(`[ ${item.quantity}x ] ${item.productName || item.name}`)
        .size(1, 1)
        .bold(false);

      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          builder.bold(true).line(`   >> ${mod.groupName}: ${mod.optionName}`).bold(false);
        }
      }
      if (item.notes) {
        builder.line(`   ** NOTE: ${item.notes} **`);
      }
      builder.divider("-");
    }

    builder
      .feed(1)
      .align("center")
      .bold(true)
      .line(`--- END OF KITCHEN TICKET ---`)
      .cut();

    return {
      rawBuffer: builder.toBuffer(),
      base64: builder.toBase64(),
      hex: builder.toHex(),
    };
  }
}

export const escposService = new ESCPOSService();
