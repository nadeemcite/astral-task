if (typeof navigator === "undefined") {
    // Define a minimal navigator with a userAgent property.
    // You can set the userAgent string to anything that suits your needs.
    (globalThis as any).navigator = { userAgent: "Deno" };
  }