import { describe, it, expect } from "vitest";
import { OtpTokenSchema } from "@/lib/validation";

describe("OtpTokenSchema", () => {
  it.each(["123456", "1234567", "12345678", "1234567890"])(
    "accepts a %s-length digit code",
    (good) => {
      expect(OtpTokenSchema.parse(good)).toBe(good);
    },
  );

  it("trims surrounding whitespace", () => {
    expect(OtpTokenSchema.parse(" 12345678 ")).toBe("12345678");
  });

  it.each(["12345", "12345678901", "abcdef", "12 456", "", "12.456"])(
    "rejects %j",
    (bad) => {
      expect(() => OtpTokenSchema.parse(bad)).toThrow();
    },
  );
});
