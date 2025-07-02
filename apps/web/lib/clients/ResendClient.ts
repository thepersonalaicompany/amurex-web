import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

export const ResendClient = new Resend(process.env.RESEND_API_KEY);
