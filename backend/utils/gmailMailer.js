let cachedAccessToken;
let accessTokenExpiresAt = 0;

const requiredEnv = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
    "GMAIL_SENDER"
];

const assertConfiguration = () => {
    const missing = requiredEnv.filter((name) => !process.env[name]?.trim());
    if (missing.length) {
        throw new Error(`Missing Gmail API configuration: ${missing.join(", ")}`);
    }
};

const getAccessToken = async () => {
    if (cachedAccessToken && Date.now() < accessTokenExpiresAt - 60_000) {
        return cachedAccessToken;
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
            grant_type: "refresh_token"
        })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.access_token) {
        console.error("[email] Google OAuth token refresh failed", {
            status: response.status,
            error: result.error || "unknown_error",
            description: result.error_description || "No access token returned"
        });
        throw new Error("Gmail API authorization failed. Check the OAuth client and refresh token.");
    }

    cachedAccessToken = result.access_token;
    accessTokenExpiresAt = Date.now() + (result.expires_in || 3600) * 1000;
    return cachedAccessToken;
};

const encodeHeader = (value) => `=?UTF-8?B?${Buffer.from(String(value)).toString("base64")}?=`;

const maskEmail = (email = "") => {
    const [localPart, domain] = email.split("@");
    return domain ? `${localPart.slice(0, 1)}***@${domain}` : "[invalid email]";
};

export const sendGmailApiMail = async (options) => {
    assertConfiguration();

    const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to;
    if (!recipients || !options.subject) {
        throw new Error("Email recipient and subject are required");
    }

    const body = options.html || options.text || "";
    const contentType = options.html ? "text/html" : "text/plain";
    const sender = `"SyncMeet" <${process.env.GMAIL_SENDER}>`;
    const headers = [
        `From: ${sender}`,
        `To: ${recipients}`,
        `Subject: ${encodeHeader(options.subject)}`,
        "MIME-Version: 1.0",
        `Content-Type: ${contentType}; charset=UTF-8`,
        "Content-Transfer-Encoding: base64"
    ];
    const replyTo = options.replyTo || options.reply_to;
    if (replyTo) headers.push(`Reply-To: ${replyTo}`);

    const mimeMessage = [
        ...headers,
        "",
        Buffer.from(body, "utf8").toString("base64")
    ].join("\r\n");
    const raw = Buffer.from(mimeMessage, "utf8").toString("base64url");
    const accessToken = await getAccessToken();

    console.debug("[email] Sending through Gmail API", {
        to: Array.isArray(options.to) ? options.to.map(maskEmail) : maskEmail(options.to),
        from: maskEmail(process.env.GMAIL_SENDER)
    });

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.id) {
        console.error("[email] Gmail API rejected message", {
            status: response.status,
            error: result.error?.message || "No message ID returned",
            to: Array.isArray(options.to) ? options.to.map(maskEmail) : maskEmail(options.to)
        });
        throw new Error("Gmail API rejected the message. Check the Gmail API and OAuth permissions.");
    }

    console.info("[email] Gmail API accepted message", {
        id: result.id,
        to: Array.isArray(options.to) ? options.to.map(maskEmail) : maskEmail(options.to),
        note: "Accepted by Gmail; check the sender's Sent folder and recipient inbox for delivery."
    });
    return { success: true, id: result.id, provider: "gmail-api" };
};
