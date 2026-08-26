import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../security/license-gateway-worker/worker.js", import.meta.url), "utf8");
const worker = (await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"))).default;
const env = {
  ADMIN_SECRET: "test-admin-secret",
  LICENSES_JSON: JSON.stringify([{ key: "HMG-209912-ABCDEF1234", email: "teacher@example.com", expires: "2099-12-31", devices: 2 }])
};
function verifyRequest(licenseKey) {
  return new Request("https://gateway.test/api/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "teacher@example.com", device: "device-1", name: "Teacher", licenseKey })
  });
}

let response = await worker.fetch(verifyRequest(""), env);
let result = await response.json();
assert.equal(result.ok, false, "email alone must not activate a license");
response = await worker.fetch(verifyRequest("HMG-209912-ABCDEF1234"), env);
result = await response.json();
assert.equal(result.ok, true, "the exact license key should be accepted");
response = await worker.fetch(verifyRequest("HMG-209912-0000000000"), env);
result = await response.json();
assert.equal(result.ok, false, "an unknown key should be rejected");

console.log("License gateway exact-key and no-email-bypass tests passed ✔");
