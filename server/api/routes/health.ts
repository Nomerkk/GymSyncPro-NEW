import { Router } from "express";
import { storage } from "../../storage";
import { env } from "../../config";

const router = Router();

router.get('/api/health', async (_req, res) => {
  const startedAt = new Date().toISOString();
  let dbConnected = true as boolean;
  let dbError: string | undefined;
  try {
    await storage.getAllUsers();
  } catch (e: any) {
    dbConnected = false;
    dbError = e?.message || 'Unknown DB error';
  }
  res.json({ ok: true, env: env.nodeEnv, startedAt, dbConnected, dbError });
});

router.get('/api/health/integrations', async (_req, res) => {
  const resp: any = { ok: true };
  const resendConfigured = Boolean(env.resend.apiKey);
  const adminKeyConfigured = Boolean(env.resend.adminApiKey);
  const verifKeyConfigured = Boolean(env.resend.verificationApiKey);
  resp.resend = {
    configured: resendConfigured,
    default: {
      fromEmail: env.resend.defaultFrom,
    },
    admin: {
      apiKeyOverride: adminKeyConfigured,
      fromEmail: env.resend.adminFrom,
      replyTo: env.resend.adminReplyTo || undefined,
    },
    verification: {
      apiKeyOverride: verifKeyConfigured,
      fromEmail: env.resend.verificationFrom,
    },
  };
  if (resendConfigured) {
    try {
      const { client } = await (await import('../../email/resend')).getUncachableResendClient();
      const anyFrom = resp.resend.admin.fromEmail || resp.resend.default.fromEmail;
      const domain = anyFrom.includes('@') ? anyFrom.split('@')[1]?.trim() : '';
      const anyClient: any = client as any;
      if (anyClient?.domains?.list && domain) {
        const result = await anyClient.domains.list();
        const domains = result?.data || result || [];
        const found = domains.find((d: any) => d?.name === domain);
        resp.resend.domain = found ? { name: found.name, status: found.status || 'unknown' } : { name: domain, status: 'unknown' };
      }
    } catch (e: any) {
      resp.resend.error = e?.message || String(e);
    }
  }
  res.json(resp);
});

export { router as healthRouter };
