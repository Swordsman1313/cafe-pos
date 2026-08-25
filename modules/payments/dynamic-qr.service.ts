import crypto from "crypto";

export class DynamicQRService {
  /**
   * Computes standard CRC16-CCITT (polynomial 0x1021, initial 0xFFFF)
   */
  public static calculateCRC16(data: string): string {
    let crc = 0xffff;
    const bytes = Buffer.from(data, "utf-8");
    for (let i = 0; i < bytes.length; i++) {
      crc ^= bytes[i] << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  private static tlv(tag: string, val: string): string {
    return `${tag}${val.length.toString().padStart(2, "0")}${val}`;
  }

  public static generateKHQRPayload(orderId: string, amount: number, billNo: string) {
    const tag29 = this.tlv("29", `${this.tlv("00", "artisan_roast@aclb")}${this.tlv("01", "INDIVIDUAL")}`);
    const tag62 = this.tlv("62", `${this.tlv("01", billNo)}${this.tlv("05", "BKK1-STORE")}`);

    const raw =
      this.tlv("00", "01") +
      this.tlv("01", "12") +
      tag29 +
      this.tlv("52", "5812") +
      this.tlv("53", "840") +
      this.tlv("54", Number(amount).toFixed(2)) +
      this.tlv("58", "KH") +
      this.tlv("59", "ARTISAN ROAST CAFE") +
      this.tlv("60", "PHNOM PENH") +
      tag62 +
      "6304";

    const crc = this.calculateCRC16(raw);
    return `${raw}${crc}`;
  }

  public static verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}
