import mongoose from "mongoose";

const featureSchema = new mongoose.Schema(
  {
    icon: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const statSchema = new mongoose.Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

/**
 * Singleton document holding everything the intro (landing) page renders.
 * Edit it in MongoDB and the page updates on the next refresh.
 */
const introSchema = new mongoose.Schema(
  {
    key: { type: String, default: "intro", unique: true, immutable: true },
    brand: { type: String, default: "ClientFlow" },
    tagline: { type: String, default: "Client Project Management Platform" },
    hero: {
      eyebrow: String,
      title: String,
      highlight: String,
      subtitle: String,
      primaryCta: String,
      secondaryCta: String,
    },
    features: [featureSchema],
    steps: [stepSchema],
    stats: [statSchema],
    cta: {
      title: String,
      subtitle: String,
      button: String,
    },
  },
  { timestamps: true }
);

export const Intro = mongoose.model("Intro", introSchema);

/** Content used when the database is empty or unavailable. */
export const DEFAULT_INTRO = {
  key: "intro",
  brand: "ClientFlow",
  tagline: "Client Project Management Platform",
  hero: {
    eyebrow: "Client Project Management Platform",
    title: "Manage every client project",
    highlight: "in one calm workspace",
    subtitle:
      "Plan milestones, track deliverables, share updates and get paid — ClientFlow keeps your agency, freelancers and clients perfectly in sync.",
    primaryCta: "Start free trial",
    secondaryCta: "See how it works",
  },
  features: [
    {
      icon: "🗂️",
      title: "Client Workspaces",
      description:
        "Give every client a branded space with files, approvals and progress they can actually follow.",
    },
    {
      icon: "🗓️",
      title: "Timelines & Milestones",
      description:
        "Drag-and-drop Gantt timelines with dependencies, owners and automatic delay alerts.",
    },
    {
      icon: "⏱️",
      title: "Time & Budget",
      description:
        "Log hours, watch burn rate in real time and keep every project inside its budget.",
    },
    {
      icon: "💬",
      title: "Feedback Loop",
      description:
        "Threaded comments and one-click approvals replace scattered email chains forever.",
    },
    {
      icon: "📄",
      title: "Proposals & Invoices",
      description:
        "Send a proposal, win the work, invoice the milestones — without leaving the platform.",
    },
    {
      icon: "📊",
      title: "Portfolio Dashboard",
      description:
        "Health scores, workload and revenue across all clients in a single live dashboard.",
    },
  ],
  steps: [
    {
      step: "01",
      title: "Create your workspace",
      description: "Sign up in 30 seconds and invite your team — no credit card required.",
    },
    {
      step: "02",
      title: "Add clients & projects",
      description: "Import tasks or start from a template built for agencies and studios.",
    },
    {
      step: "03",
      title: "Deliver & get paid",
      description: "Share progress, collect approvals and invoice straight from the timeline.",
    },
  ],
  stats: [
    { value: "12k+", label: "Projects delivered" },
    { value: "3.5k", label: "Teams onboard" },
    { value: "98%", label: "On-time delivery" },
    { value: "4.9/5", label: "Average rating" },
  ],
  cta: {
    title: "Ready to run your client projects like clockwork?",
    subtitle: "Free 14-day trial. Unlimited projects. Cancel anytime.",
    button: "Create your workspace",
  },
};
