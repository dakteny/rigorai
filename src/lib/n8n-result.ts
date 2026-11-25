export function formatN8nOutput(raw: string) {
  if (!raw) return "Workflow completed successfully with no response body.";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function n8nFailureMessage(status: number, testWebhook: boolean) {
  if (status === 404 && testWebhook) {
    return "n8n is not listening for this test webhook. Open the workflow in n8n, select Listen for test event, then run the automation again.";
  }
  if (status === 401 || status === 403) {
    return "n8n rejected the webhook authentication. Check the workflow's Header Auth settings.";
  }
  return `n8n returned HTTP ${status}. Check the webhook configuration and workflow response.`;
}
