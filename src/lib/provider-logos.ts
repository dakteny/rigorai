import gmail from "@/assets/integration-gmail.asset.json";
import sheets from "@/assets/integration-google-sheets.asset.json";
import drive from "@/assets/integration-google-drive.asset.json";
import slack from "@/assets/integration-slack.asset.json";
import whatsapp from "@/assets/integration-whatsapp.asset.json";
import telegram from "@/assets/integration-telegram.asset.json";
import shopify from "@/assets/integration-shopify.asset.json";
import stripe from "@/assets/integration-stripe.asset.json";
import wordpress from "@/assets/integration-wordpress.asset.json";
import facebook from "@/assets/integration-facebook.asset.json";
import instagram from "@/assets/integration-instagram.asset.json";
import hubspot from "@/assets/integration-hubspot.asset.json";
import openai from "@/assets/integration-openai.asset.json";

// Static brand artwork from SVGL; HubSpot artwork from Simple Icons.
export const providerLogos: Record<string, string> = {
  Gmail: gmail.url,
  "Google Sheets": sheets.url,
  "Google Drive": drive.url,
  Slack: slack.url,
  WhatsApp: whatsapp.url,
  Telegram: telegram.url,
  Shopify: shopify.url,
  Stripe: stripe.url,
  WordPress: wordpress.url,
  Facebook: facebook.url,
  Instagram: instagram.url,
  HubSpot: hubspot.url,
  OpenAI: openai.url,
};