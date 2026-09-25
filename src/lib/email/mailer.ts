import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "@/lib/env";

let transporter: Transporter | undefined;

const colors = {
    green: "#145b4c",
    ink: "#193d35",
    gold: "#bd8845",
    goldSoft: "#f8f2e8",
    muted: "#68776f",
    line: "#e4e9e5",
    canvas: "#f6f7f4",
    white: "#ffffff",
};

function getMailTransport() {
    const env = getEnv();
    if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_FROM) {
        throw new Error("Email delivery is not configured.");
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            ...(env.SMTP_USER && env.SMTP_PASSWORD
                ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
                : {}),
        });
    }

    return { transport: transporter, from: env.SMTP_FROM };
}

function linkFor(path: string, token: string) {
    const url = new URL(path, getEnv().NEXT_PUBLIC_APP_URL);
    url.searchParams.set("token", token);
    return url.toString();
}

function appUrl() {
    return new URL("/", getEnv().NEXT_PUBLIC_APP_URL).toString();
}

function escapeHtml(value: string) {
    const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };
    return value.replace(/[&<>"']/g, (character) => entities[character]);
}

type EmailTemplate = {
    preheader: string;
    eyebrow: string;
    title: string;
    paragraphs: string[];
    action?: { label: string; url: string };
    note?: string;
};

function renderEmail({ preheader, eyebrow, title, paragraphs, action, note }: EmailTemplate) {
    const home = escapeHtml(appUrl());
    const safePreheader = escapeHtml(preheader);
    const safeEyebrow = escapeHtml(eyebrow);
    const safeTitle = escapeHtml(title);
    const paragraphHtml = paragraphs
        .map((paragraph) => `<p style="margin:0 0 16px;color:${colors.muted};font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:25px;">${escapeHtml(paragraph)}</p>`)
        .join("");
    const actionHtml = action
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 22px;"><tr><td align="center" bgcolor="${colors.green}" style="border-radius:10px;"><a href="${escapeHtml(action.url)}" style="display:inline-block;padding:14px 22px;border:1px solid ${colors.green};border-radius:10px;color:${colors.white};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;line-height:20px;text-decoration:none;">${escapeHtml(action.label)}</a></td></tr></table>
            <p style="margin:0 0 8px;color:${colors.muted};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;">If the button does not open, copy this link into your browser:</p>
            <p style="margin:0 0 22px;overflow-wrap:anywhere;color:${colors.green};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;"><a href="${escapeHtml(action.url)}" style="color:${colors.green};text-decoration:underline;">${escapeHtml(action.url)}</a></p>`
        : "";
    const noteHtml = note
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td style="border-left:3px solid ${colors.gold};border-radius:4px;background:${colors.goldSoft};padding:13px 15px;color:${colors.ink};font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">${escapeHtml(note)}</td></tr></table>`
        : "";

    const text = [
        "Courier",
        "",
        title,
        "",
        ...paragraphs,
        ...(action ? ["", `${action.label}: ${action.url}`] : []),
        ...(note ? ["", note] : []),
        "",
        `Courier - ${appUrl()}`,
    ].join("\n");

    const html = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:${colors.canvas};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${safePreheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${colors.canvas};">
        <tr><td align="center" style="padding:34px 14px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
                <tr><td style="padding:0 0 14px 4px;">
                    <a href="${home}" style="color:${colors.ink};font-family:Arial,Helvetica,sans-serif;font-size:25px;font-weight:bold;letter-spacing:-1.3px;text-decoration:none;">Courier<span style="color:${colors.gold};">.</span></a>
                </td></tr>
                <tr><td style="overflow:hidden;border:1px solid ${colors.line};border-radius:18px;background:${colors.white};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr><td height="5" style="height:5px;background:${colors.green};font-size:0;line-height:0;">&nbsp;</td></tr>
                        <tr><td style="padding:36px 38px 38px;">
                            <p style="margin:0 0 12px;color:${colors.green};font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:1.8px;line-height:16px;text-transform:uppercase;"><span style="color:${colors.gold};">&#9679;</span>&nbsp;&nbsp;${safeEyebrow}</p>
                            <h1 style="margin:0 0 20px;color:${colors.ink};font-family:Arial,Helvetica,sans-serif;font-size:29px;font-weight:bold;letter-spacing:-.7px;line-height:36px;">${safeTitle}</h1>
                            ${paragraphHtml}
                            ${actionHtml}
                            ${noteHtml}
                        </td></tr>
                    </table>
                </td></tr>
                <tr><td align="center" style="padding:20px 16px 0;color:${colors.muted};font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;">
                    Courier helps people move the things that matter.<br>
                    <a href="${home}" style="color:${colors.green};text-decoration:underline;">Visit Courier</a>
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;

    return { html, text };
}

export function assertEmailDeliveryConfigured() {
    getMailTransport();
}

export async function sendVerificationEmail(email: string, token: string) {
    const { transport, from } = getMailTransport();
    const url = linkFor("/verify-email", token);
    const template = renderEmail({
        preheader: "Verify your email to finish setting up your Courier account.",
        eyebrow: "Welcome to Courier",
        title: "Verify your email address",
        paragraphs: ["Confirm your email address to finish setting up your Courier account."],
        action: { label: "Verify email address", url },
        note: "This verification link expires in 24 hours. If you did not create a Courier account, you can ignore this email.",
    });
    await transport.sendMail({ from, to: email, subject: "Verify your Courier email", ...template });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const { transport, from } = getMailTransport();
    const url = linkFor("/reset-password", token);
    const template = renderEmail({
        preheader: "Use the secure link to choose a new Courier password.",
        eyebrow: "Account security",
        title: "Reset your password",
        paragraphs: ["A password reset was requested for your Courier account. Use the button below to choose a new password."],
        action: { label: "Choose a new password", url },
        note: "This reset link expires in 30 minutes. If you did not request a reset, ignore this email; your password will not change.",
    });
    await transport.sendMail({ from, to: email, subject: "Reset your Courier password", ...template });
}

export async function sendPasswordChangedEmail(email: string) {
    const { transport, from } = getMailTransport();
    const template = renderEmail({
        preheader: "Your Courier password has been changed.",
        eyebrow: "Security update",
        title: "Your password was changed",
        paragraphs: ["The password for your Courier account was changed."],
        note: "If you did not make this change, contact Courier support immediately.",
    });
    await transport.sendMail({ from, to: email, subject: "Your Courier password was changed", ...template });
}
