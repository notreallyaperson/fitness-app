import { describe, it, expect } from "vitest";
import { OtpTokenSchema } from "@/lib/validation";

describe("OtpTokenSchema", () => {
  it("accepts a 6-digit code", () => {
    expect(OtpTokenSchema.parse("123456")).toBe("123456");
  });

  it("trims surrounding whitespace", () => {
    expect(OtpTokenSchema.parse(" 123456 ")).toBe("123456");
  });

  it.each(["12345", "1234567", "abcdef", "12 456", "", "12.456"])(
    "rejects %j",
    (bad) => {
      expect(() => OtpTokenSchema.parse(bad)).toThrow();
    },
  );
});
