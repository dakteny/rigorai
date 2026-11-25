import {
  Bot,
  Workflow,
  Mail,
  Target,
  ShoppingBag,
  MessagesSquare,
  Globe,
  Share2,
  Layers,
  Sparkles,
} from "lucide-react";
export const services = [
  {
    name: "AI Business Automation",
    icon: Workflow,
    description:
      "Put repetitive work on autopilot. Connect your processes and let intelligent workflows handle the heavy lifting.",
    benefits: [
      "Connected business processes",
      "Intelligent task routing",
      "Real execution monitoring",
    ],
  },
  {
    name: "AI Customer Support Agents",
    icon: MessagesSquare,
    description:
      "Deliver helpful, personalized support around the clock with AI agents that understand your business.",
    benefits: [
      "Custom business instructions",
      "Conversation history",
      "Consistent customer responses",
    ],
  },
  {
    name: "Lead Generation Automation",
    icon: Target,
    description:
      "Turn more opportunities into customers with automated lead capture, enrichment, and follow-up.",
    benefits: ["Organized lead capture", "Automated qualification", "Timely follow-ups"],
  },
  {
    name: "Automated Email Management",
    icon: Mail,
    description:
      "From inbox organization to thoughtful replies, make every email work harder for your business.",
    benefits: ["Smart categorization", "Drafted responses", "Connected email actions"],
  },
  {
    name: "E-commerce Automation",
    icon: ShoppingBag,
    description:
      "Keep your store running smoothly with connected orders, customer updates, and inventory workflows.",
    benefits: ["Order notifications", "Customer synchronization", "Streamlined operations"],
  },
  {
    name: "Custom AI Agent Development",
    icon: Bot,
    description:
      "Build a specialized AI teammate with the knowledge, objectives, and personality your business needs.",
    benefits: ["Custom objectives", "Configurable instructions", "Live agent testing"],
  },
  {
    name: "Website and App Automation",
    icon: Globe,
    description:
      "Connect your website and applications to the processes that keep your business moving.",
    benefits: ["Connected forms", "Application synchronization", "Event-driven actions"],
  },
  {
    name: "Social Media Automation",
    icon: Share2,
    description:
      "Simplify content planning and connect your social activity to your wider business.",
    benefits: ["Content assistance", "Campaign processes", "Connected publishing tools"],
  },
  {
    name: "Business Process Automation",
    icon: Layers,
    description:
      "Make your operations consistent with structured workflows and clear execution history.",
    benefits: ["Repeatable operations", "Clear ownership", "Error visibility"],
  },
  {
    name: "AI Chatbots",
    icon: Sparkles,
    description:
      "Create conversational assistants that answer questions using your business instructions.",
    benefits: ["Custom knowledge", "Helpful conversations", "Conversation review"],
  },
];
export const providers = [
  "Gmail",
  "Google Sheets",
  "Google Drive",
  "Slack",
  "WhatsApp",
  "Telegram",
  "Shopify",
  "Stripe",
  "WordPress",
  "Facebook",
  "Instagram",
  "HubSpot",
  "OpenAI",
];
export const planAmounts = { Free: 0, Pro: 50, Business: 100 } as const;
export const planCurrency = "USD";
export const planBillingInterval = "month";
export function planPriceLabel(plan: keyof typeof planAmounts) {
  return `${planAmounts[plan]}$${plan === "Free" ? "" : "/month"}`;
}
export const templates = [
  "Welcome new customers",
  "Capture website enquiries",
  "Notify on new orders",
  "Categorize customer inquiries",
  "Generate AI customer replies",
  "Organize incoming leads",
  "Send appointment reminders",
  "Synchronize customer information",
];
