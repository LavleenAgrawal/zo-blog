import type { IncomingMessage, ServerResponse } from "http";

interface ContactRequestBody {
  lastName: string;
  email: string;
  phone: string;
  message: string;
}

export async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const { lastName, email, phone, message }: ContactRequestBody = JSON.parse(body);

      if (!lastName || !email || !phone || !message) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing fields" }));
        return;
      }

      const webhook = process.env.SLACK_WEBHOOK_URL;
      if (!webhook) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Slack webhook not configured" }));
        return;
      }

      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `📩 *New Contact Message*\n*Name:* ${lastName}\n*Email:* ${email}\n*Phone:* ${phone}\n*Message:* ${message}`,
        }),
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server error" }));
    }
  });
}
