const defaults = [
    "http://localhost:5174",
    "https://syncmeet-web.vercel.app"
];

export const allowedOrigins = [...new Set([
    ...defaults,
    ...(process.env.FRONTEND_URLS || "").split(","),
    process.env.FRONTEND_URL || ""
].map((origin) => origin.trim()).filter(Boolean))];
