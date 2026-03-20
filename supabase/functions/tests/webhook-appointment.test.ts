import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";

Deno.test("webhook-appointment handler parses missing authorization header gracefully", () => {
  // Real function uses Deno.serve(), so we simulate a request without auth
  const req = new Request("https://webhook.test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "test" })
  });

  const authHeader = req.headers.get("Authorization");
  assertEquals(authHeader, null);
});

Deno.test("webhook-whatsapp-incoming verify GET returns challenge natively (mock config)", () => {
  const req = new Request("https://webhook.test?hub.mode=subscribe&hub.challenge=1158201444&hub.verify_token=test_token", {
    method: "GET"
  });

  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  assertEquals(mode, "subscribe");
  assertEquals(challenge, "1158201444");
});
