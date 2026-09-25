import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "@/lib/env";

let transporter: Transporter | undefined;

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

export function assertEmailDeliveryConfigured() {
  getMailTransport();
}

export async function sendVerificationEmail(email: string, token: string) {
  const { transport, from } = getMailTransport();
  const url = linkFor("/verify-email", token);
  await transport.sendMail({
    from,
    to: email,
    subject: "Verify your Courier email",
    text: `Confirm your email address by opening this link: ${url}\n\nThis link expires in 24 hours. If you did not create a Courier account, you can ignore this email.`,
    html: `<p>Confirm your email address to finish setting up Courier.</p><p><a href="${url}">Verify email address</a></p><p>This link expires in 24 hours. If you did not create a Courier account, you can ignore this email.</p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const { transport, from } = getMailTransport();
  const url = linkFor("/reset-password", token);
  await transport.sendMail({
    from,
    to: email,
    subject: "Reset your Courier password",
    text: `Choose a new password by opening this link: ${url}\n\nThis link expires in 30 minutes. If you did not request a reset, ignore this email; your password will not change.`,
    html: `<p>A password reset was requested for your Courier account.</p><p><a href="${url}">Choose a new password</a></p><p>This link expires in 30 minutes. If you did not request a reset, ignore this email; your password will not change.</p>`,
  });
}

export async function sendPasswordChangedEmail(email: string) {
  const { transport, from } = getMailTransport();
  await transport.sendMail({
    from,
    to: email,
    subject: "Your Courier password was changed",
    text: "Your Courier password was changed. If you did not make this change, contact Courier support immediately.",
    html: "<p>Your Courier password was changed.</p><p>If you did not make this change, contact Courier support immediately.</p>",
  });
}
