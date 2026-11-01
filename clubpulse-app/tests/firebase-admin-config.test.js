import { afterEach, describe, expect, it } from "vitest";
import { verifyIdToken } from "@/lib/firebaseAdmin";

const originalServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

afterEach(() => {
  if (originalServiceAccount === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  else process.env.FIREBASE_SERVICE_ACCOUNT_JSON = originalServiceAccount;
});

describe("Firebase Admin configuration", () => {
  it("throws FIREBASE_ADMIN_NOT_CONFIGURED when the service account is missing", () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    try {
      verifyIdToken("unused-token");
      throw new Error("Expected Firebase Admin configuration to fail.");
    } catch (error) {
      expect(error.code).toBe("FIREBASE_ADMIN_NOT_CONFIGURED");
    }
  });

  it.each([
    ["invalid JSON", "{not-json"],
    ["missing service-account fields", JSON.stringify({ project_id: "clubpulse-test" })],
    ["invalid private key", JSON.stringify({
      project_id: "clubpulse-test",
      client_email: "test@clubpulse-test.iam.gserviceaccount.com",
      private_key: "not-a-private-key",
    })],
  ])("throws FIREBASE_ADMIN_NOT_CONFIGURED for %s", (_label, serviceAccount) => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = serviceAccount;

    try {
      verifyIdToken("unused-token");
      throw new Error("Expected Firebase Admin configuration to fail.");
    } catch (error) {
      expect(error.code).toBe("FIREBASE_ADMIN_NOT_CONFIGURED");
    }
  });
});
