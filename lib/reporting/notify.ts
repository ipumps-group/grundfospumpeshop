/**
 * E-mail delivery of a stored weekly report via Resend (Pumbapood's own
 * RESEND_API_KEY / sender domain). Recipients from the
 * `report_email_recipients` setting (editable in /haldus/seaded),
 * fallback info@pumbapood.ee.
 */

import { getResend, EMAIL_FROM, EMAIL_REPLY_TO, SITE_URL } from "@/lib/resend"
import { buildReportEmail } from "./email-html"
import { getReportRecipients, markReportEmailSent } from "./store"
import type { StoredReport } from "./types"

export async function sendReportEmail(
  report: StoredReport,
): Promise<{ success: boolean; error?: string; recipients: string }> {
  const recipients = await getReportRecipients()
  const adminUrl = `${SITE_URL}/haldus/raportid/${report.id}/`
  const mail = buildReportEmail(report, adminUrl)

  let success = false
  let error: string | undefined
  try {
    const res = await getResend().emails.send({
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      to: recipients.split(",").map((a) => a.trim()).filter(Boolean),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    })
    if (res.error) {
      error = res.error.message ?? "Resend error"
    } else {
      success = true
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown email error"
  }

  await markReportEmailSent(report.id, success ? undefined : error ?? "send failed")
  return { success, error, recipients }
}
