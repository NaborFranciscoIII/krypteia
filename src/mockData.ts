export const tutorialSlides = [
  {
    icon: "key",
    eyebrow: "Your one key",
    title: "One key. Total control.",
    description:
      "Your Vault Key encrypts and unlocks everything in Krypteia. Only you know it—so make it memorable.",
  },
  {
    icon: "layers",
    eyebrow: "Built for clarity",
    title: "Everything has its place.",
    description:
      "Organize Services, Accounts, and Credentials in a structure that stays clear, even as your vault grows.",
  },
  {
    icon: "trash",
    eyebrow: "A safer delete",
    title: "Mistakes aren’t permanent.",
    description:
      "Deleted items wait in the Recycle Bin before they’re gone for good, giving you time to change your mind.",
  },
  {
    icon: "privacy",
    eyebrow: "Private by default",
    title: "Locked when you step away.",
    description:
      "Auto-lock protects your vault when it’s idle. Your Vault Key and private data never leave this device.",
  },
];

export const recoveryQuestions = [
  { id: "school", question: "What was the name of your first school?" },
  { id: "street", question: "What street did you grow up on?" },
  { id: "place", question: "Where did you take your first trip?" },
  { id: "custom", question: "Write my own question" },
];

export type Category = { id: string; name: string };
export const mockCategories: Category[] = [
  { id: "social", name: "Social" },
  { id: "finance", name: "Finance" },
  { id: "work", name: "Work" },
  { id: "shopping", name: "Shopping" },
  { id: "entertainment", name: "Entertainment" },
  { id: "gaming", name: "Gaming" },
  { id: "other", name: "Other" },
];

const logoImage = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
export const mockLogoImages: Record<string, string> = {
  "github.com": logoImage('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="white"/><path fill="black" d="M14 18 13 9l9 5h4l9-5-1 9c3 3 4 6 3 10-1 6-6 9-13 9s-12-3-13-9c-1-4 0-7 3-10Z"/><path fill="black" d="M20 34h8v11h-8zM19 37c-9 3-12-1-13-7l4-1c1 4 3 6 9 4z"/></svg>'),
  "notion.so": logoImage('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="white"/><rect x="9" y="9" width="30" height="30" rx="3" fill="none" stroke="black" stroke-width="2"/><path d="M16 34V15l16 19V15" fill="none" stroke="black" stroke-width="4" stroke-linejoin="round"/></svg>'),
};

export type Service = {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  iconMode: "automatic" | "image" | "letter";
  iconImage?: string;
  deletedAt: string | null;
};

export type Account = {
  id: string;
  serviceId: string;
  username: string;
  email: string;
  accountId: string;
  password: string;
  deletedAt: string | null;
};

export type Credential = {
  id: string;
  accountId: string;
  type: "passkey" | "security_question" | "other";
  label: string;
  details: string;
  deletedAt: string | null;
};

export type RecoveryMethods = { recoveryKey: boolean; questions: boolean };
export const mockRecoveryMethods: RecoveryMethods = { recoveryKey: false, questions: false };
export const mockRecoveryKey = ["K7M2Q", "9PX4T", "VL8CN", "3RW6H", "J5DZA", "82FYG", "N4BKS", "QW7E3"];

export type Activity = { id: string; label: string; timestamp: number };
const now = Date.now();
const archiveDeletedAt = new Date(now - 25 * 86400000).toISOString();
export const mockActivity: Activity[] = [
  { id: "activity-1", label: "Added account to GitHub", timestamp: now - 2 * 3600000 },
  { id: "activity-2", label: "Edited Notion", timestamp: now - 5 * 3600000 },
  { id: "activity-3", label: "Restored Vercel", timestamp: now - 86400000 },
  { id: "activity-4", label: "Added account to Linear", timestamp: now - 2 * 86400000 },
  { id: "activity-5", label: "Moved Proton Mail to Recycle Bin", timestamp: now - 25 * 86400000 },
];

export const mockServices: Service[] = [
  { id: "svc-linear", title: "Linear", url: "linear.app", categoryId: "work", iconMode: "automatic", deletedAt: null },
  { id: "svc-github", title: "GitHub", url: "github.com", categoryId: "work", iconMode: "automatic", deletedAt: null },
  { id: "svc-notion", title: "Notion", url: "notion.so", categoryId: "work", iconMode: "automatic", deletedAt: null },
  { id: "svc-vercel", title: "Vercel", url: "vercel.com", categoryId: "work", iconMode: "automatic", deletedAt: null },
  { id: "svc-supercell", title: "Supercell", url: "supercell.com", categoryId: "gaming", iconMode: "automatic", deletedAt: null },
  { id: "svc-archive", title: "Proton Mail", url: "proton.me", categoryId: "other", iconMode: "automatic", deletedAt: archiveDeletedAt },
];

export const mockAccounts: Account[] = [
  {
    id: "acc-linear-work",
    serviceId: "svc-linear",
    username: "alex.morgan",
    email: "alex@northstar.studio",
    accountId: "ORG-2849-A",
    password: "Aurora!Drifts#Above92",
    deletedAt: null,
  },
  {
    id: "acc-github-main",
    serviceId: "svc-github",
    username: "alexm-dev",
    email: "alex@northstar.studio",
    accountId: "GH-882104",
    password: "cosmos-river-lantern-47",
    deletedAt: null,
  },
  {
    id: "acc-github-client",
    serviceId: "svc-github",
    username: "northstar-client",
    email: "studio.ops@northstar.studio",
    accountId: "GH-901244",
    password: "orbit",
    deletedAt: null,
  },
  {
    id: "acc-notion",
    serviceId: "svc-notion",
    username: "alex@northstar.studio",
    email: "alex@northstar.studio",
    accountId: "WS-43102",
    password: "Glass Orchard Satellite 88!",
    deletedAt: null,
  },
  {
    id: "acc-vercel",
    serviceId: "svc-vercel",
    username: "northstar",
    email: "deploy@northstar.studio",
    accountId: "team_Q5f91",
    password: "Vercel-demo-key-551",
    deletedAt: null,
  },
  {
    id: "acc-linear-personal",
    serviceId: "svc-linear",
    username: "alex.play",
    email: "alex.play@northstar.studio",
    accountId: "SC-77291",
    password: "orbit",
    deletedAt: null,
  },
  {
    id: "acc-archive",
    serviceId: "svc-archive",
    username: "alex.private",
    email: "alex.morgan@proton.me",
    accountId: "PM-8841",
    password: "winter-archive-2022",
    deletedAt: archiveDeletedAt,
  },
];

export const mockCredentials: Credential[] = [
  {
    id: "cred-linear-passkey",
    accountId: "acc-linear-work",
    type: "passkey",
    label: "MacBook Pro passkey",
    details: "Created on this device · Touch ID",
    deletedAt: null,
  },
  {
    id: "cred-linear-question",
    accountId: "acc-linear-work",
    type: "security_question",
    label: "Recovery question",
    details: "First concert attended",
    deletedAt: null,
  },
  {
    id: "cred-github-key",
    accountId: "acc-github-main",
    type: "other",
    label: "Recovery codes",
    details: "Stored offline · refreshed Jan 2025",
    deletedAt: null,
  },
];
