import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import {
  ArchiveRestore,
  ArrowLeft,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Copy,
  Eye,
  EyeOff,
  FileKey2,
  Fingerprint,
  HelpCircle,
  History,
  House,
  Import,
  Image,
  KeyRound,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Trash2,
  Vault,
  WandSparkles,
  X,
} from "lucide-react";
import {
  mockAccounts,
  mockCredentials,
  mockActivity,
  mockCategories,
  mockLogoImages,
  type Category,
  type Activity,
  type RecoveryMethods,
  mockServices,
  type Account,
  type Credential,
  type Service,
} from "./mockData";

// Local primitives retain the native semantics and existing global control styles.
function Button({ type = "button", ...props }: ComponentProps<"button">) { return createElement("button", { ...props, type }); }
function TextInput(props: ComponentProps<"input">) { return createElement("input", props); }
function Select(props: ComponentProps<"select">) { return createElement("select", props); }
function Option(props: ComponentProps<"option">) { return createElement("option", props); }
function TextArea(props: ComponentProps<"textarea">) { return createElement("textarea", props); }
function Link(props: ComponentProps<"a">) { return createElement("a", props); }
function PageTitle(props: ComponentProps<"h1">) { return createElement("h1", props); }
function SectionTitle(props: ComponentProps<"h2">) { return createElement("h2", props); }

type Tab = "home" | "vault" | "generator" | "bin" | "settings";
type AccountFilter = "weak" | "reused";
type View =
  | { name: "home" }
  | { name: "filtered-accounts"; filter: AccountFilter }
  | { name: "service"; id: string }
  | { name: "account"; id: string }
  | { name: "form"; kind: "service" | "account" | "credential"; id?: string; parentId?: string }
  | { name: "change-key" }
  | { name: "categories" }
  | { name: "recovery-settings" };

function strength(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 13) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score++;
  const labels = ["Weak", "Weak", "Fair", "Good", "Strong"] as const;
  const tones = ["error", "error", "warning", "good", "success"];
  return { score: Math.max(1, score), label: labels[score], tone: tones[score] };
}

function PasswordStrength({ value }: { value: string }) {
  const result = strength(value);
  return (
    <div className="strength">
      <div className="strength-copy"><span>Password strength</span><strong className={`tone-${result.tone}`}>{result.label}</strong></div>
      <div className="strength-track">
        {[1, 2, 3, 4].map((part) => <span key={part} className={part <= result.score ? `active ${result.tone}` : ""} />)}
      </div>
    </div>
  );
}

const FetchIconsContext = createContext(false);

function websiteDomain(url: string) {
  try {
    const parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname.includes(".") ? parsed.hostname.replace(/^www\./, "") : "";
  } catch { return ""; }
}

function ItemIcon({ title, service }: { title: string; service?: Pick<Service, "url" | "iconMode" | "iconImage"> }) {
  const fetchIcons = useContext(FetchIconsContext);
  const [failedSource, setFailedSource] = useState("");
  const domain = service ? websiteDomain(service.url) : "";
  const source = !service || service.iconMode === "letter" ? "" : service.iconMode === "image" ? service.iconImage ?? "" : mockLogoImages[domain] ?? (fetchIcons && domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : "");
  return <span className="service-monogram">{source && source !== failedSource ? <img src={source} alt="" referrerPolicy="no-referrer" onError={() => setFailedSource(source)} /> : title.slice(0, 1).toUpperCase()}</span>;
}

function AppHeader({ title, eyebrow, subtitle, onBack, action }: { title: string; eyebrow?: string; subtitle?: string; onBack?: () => void; action?: React.ReactNode }) {
  return (
    <header className="manager-header">
      <div className="manager-heading">
        {onBack && <Button className="icon-button" type="button" onClick={onBack} aria-label="Go back"><ArrowLeft size={20} /></Button>}
        <div>{eyebrow && <span>{eyebrow}</span>}<PageTitle>{title}</PageTitle>{subtitle && <p className="header-subtitle">{subtitle}</p>}</div>
      </div>
      {action}
    </header>
  );
}

function EmptyState({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="manager-empty"><span>{icon}</span><strong>{title}</strong><p>{copy}</p></div>;
}

function activeAccounts(services: Service[], accounts: Account[]) {
  return accounts.filter((account) => !account.deletedAt && services.some((service) => service.id === account.serviceId && !service.deletedAt));
}

function reusedPasswords(accounts: Account[]) {
  const counts = new Map<string, number>();
  accounts.forEach(({ password }) => { if (password) counts.set(password, (counts.get(password) ?? 0) + 1); });
  return new Set([...counts].filter(([, count]) => count > 1).map(([password]) => password));
}

function binItems(services: Service[], accounts: Account[]) {
  return [
    ...services.filter((item) => item.deletedAt).map((item) => ({ ...item, kind: "service" as const, subtitle: item.url })),
    ...accounts.filter((item) => item.deletedAt && !services.find((service) => service.id === item.serviceId)?.deletedAt).map((item) => ({ ...item, title: item.username, kind: "account" as const, subtitle: item.email })),
  ];
}

function retentionDays(date: string) {
  return Math.max(0, Math.ceil((new Date(date).getTime() + 30 * 86400000 - Date.now()) / 86400000));
}

function relativeTime(timestamp: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function HomeScreen({ services, accounts, recovery, activity, onFilter, onBin, onRecovery, onAdd, onGenerate }: {
  services: Service[]; accounts: Account[]; recovery: RecoveryMethods; activity: Activity[];
  onFilter: (filter: AccountFilter) => void; onBin: () => void; onRecovery: () => void; onAdd: () => void; onGenerate: () => void;
}) {
  const active = activeAccounts(services, accounts);
  const weak = active.filter((account) => strength(account.password).label === "Weak").length;
  const reused = reusedPasswords(active).size;
  const expiring = binItems(services, accounts).filter((item) => { const days = retentionDays(item.deletedAt!); return days > 0 && days <= 7; }).length;
  const needsRecovery = !recovery.questions && !recovery.recoveryKey;
  return <>
    <AppHeader title="Home" subtitle={`${services.filter((service) => !service.deletedAt).length} services, ${active.length} accounts`} />
    <div className="home-quick-actions">
      <Button className="manager-secondary" type="button" onClick={onAdd}><Plus size={18} /> Add service</Button>
      <Button className="manager-secondary" type="button" onClick={onGenerate}><WandSparkles size={18} /> Generate password</Button>
    </div>
    <section className="home-section" aria-labelledby="attention-title">
      <SectionTitle id="attention-title">Needs attention</SectionTitle>
      <div className="attention-list">
        {weak > 0 && <div className="attention-row tone-error"><SettingRow icon={<ShieldAlert size={19} />} title={`${weak} weak ${weak === 1 ? "password" : "passwords"}`} subtitle="Choose a stronger password" value={String(weak)} onClick={() => onFilter("weak")} /></div>}
        {reused > 0 && <div className="attention-row tone-warning"><SettingRow icon={<Copy size={19} />} title={`${reused} ${reused === 1 ? "password used" : "passwords used"} on multiple accounts`} subtitle="Use a unique password for each account" value={String(reused)} onClick={() => onFilter("reused")} /></div>}
        {expiring > 0 && <div className="attention-row tone-warning"><SettingRow icon={<Trash2 size={19} />} title={`${expiring} ${expiring === 1 ? "item expires" : "items expire"} within 7 days`} subtitle="Review your Recycle Bin" value={String(expiring)} onClick={onBin} /></div>}
        {needsRecovery && <div className="attention-row tone-warning"><SettingRow icon={<KeyRound size={19} />} title="Recovery not set up" subtitle="Add a way back into your vault" value="1" onClick={onRecovery} /></div>}
      </div>
      {!weak && !reused && !expiring && !needsRecovery && <div className="home-all-clear"><ShieldCheck size={23} /><div><strong>All clear</strong><p>Nothing needs your attention right now.</p></div></div>}
    </section>
    <section className="home-section" aria-labelledby="activity-title">
      <SectionTitle id="activity-title">Recent activity</SectionTitle>
      {activity.length ? <ul className="activity-list">{activity.slice(0, 5).map((item) => <li key={item.id}><span className="activity-icon"><History size={16} /></span><span>{item.label}</span><time dateTime={new Date(item.timestamp).toISOString()}>{relativeTime(item.timestamp)}</time></li>)}</ul> : <p className="activity-empty">No activity yet. Your next vault action will appear here.</p>}
    </section>
  </>;
}

function FilteredAccounts({ filter, services, accounts, onBack, onAccount }: {
  filter: AccountFilter; services: Service[]; accounts: Account[]; onBack: () => void; onAccount: (id: string) => void;
}) {
  const active = activeAccounts(services, accounts);
  const reused = reusedPasswords(active);
  const list = active.filter((account) => filter === "weak" ? strength(account.password).label === "Weak" : reused.has(account.password));
  return <>
    <AppHeader title={filter === "weak" ? "Weak passwords" : "Reused passwords"} subtitle={`${list.length} ${list.length === 1 ? "account" : "accounts"} to review`} onBack={onBack} />
    <div className="account-list">{list.map((account) => <Button className="account-row" type="button" key={account.id} onClick={() => onAccount(account.id)}><span className="round-icon"><CircleUserRound size={20} /></span><span className="row-copy"><strong>{account.username}</strong><small>{services.find((service) => service.id === account.serviceId)?.title} · {account.email}</small></span><ChevronRight size={18} /></Button>)}</div>
    {!list.length && <EmptyState icon={<ShieldCheck size={27} />} title="All clear" copy="No accounts match this filter." />}
  </>;
}

function VaultHome({
  services,
  accounts,
  onService,
  onAdd,
  categories,
}: {
  services: Service[];
  accounts: Account[];
  categories: Category[];
  onService: (id: string) => void;
  onAdd: () => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const visible = services.filter((service) => !service.deletedAt && (categoryId === "all" || service.categoryId === categoryId) && `${service.title} ${service.url}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <>
      <AppHeader
        eyebrow="Personal vault"
        title="Services"
        action={<Button className="manager-primary vault-add-service" type="button" onClick={onAdd} aria-label="Add service"><Plus size={18} /><span>Add service</span></Button>}
      />
      <div className="search-field"><Search size={18} /><TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services" /></div>
      <div className="category-chips" role="group" aria-label="Filter services by category">
        {[{ id: "all", name: "All" }, ...categories].map((category) => <Button key={category.id} type="button" className={categoryId === category.id ? "active" : ""} aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)}>{category.name}</Button>)}
      </div>
      <div className="section-meta"><span>{visible.length} services</span><Button type="button"><SlidersHorizontal size={16} /> Sort</Button></div>
      <div className="service-grid">
        {visible.map((service) => {
          const count = accounts.filter((account) => account.serviceId === service.id && !account.deletedAt).length;
          return (
            <Button className="service-row" type="button" key={service.id} onClick={() => onService(service.id)}>
              <ItemIcon title={service.title} service={service} />
              <span className="row-copy"><strong>{service.title}</strong><small>{service.url} · {categories.find((category) => category.id === service.categoryId)?.name ?? "Other"}</small></span>
              <span className="account-count">{count} {count === 1 ? "account" : "accounts"}</span>
              <ChevronRight size={18} />
            </Button>
          );
        })}
      </div>
      {!visible.length && <EmptyState icon={<Search size={27} />} title="No services found" copy="Try a different search or category." />}
    </>
  );
}

function ServiceDetail({
  service,
  accounts,
  onBack,
  onAccount,
  onAdd,
  onEdit,
  onDelete,
  categories,
}: {
  service: Service;
  accounts: Account[];
  onBack: () => void;
  onAccount: (id: string) => void;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  categories: Category[];
}) {
  const list = accounts.filter((account) => account.serviceId === service.id && !account.deletedAt);
  return (
    <>
      <AppHeader title={service.title} eyebrow="Service" onBack={onBack} action={<Button className="icon-button outlined" type="button" aria-label="More options"><MoreHorizontal size={21} /></Button>} />
      <section className="service-hero">
        <ItemIcon title={service.title} service={service} />
        <div><strong>{service.title}</strong><Link href={/^https?:\/\//i.test(service.url) ? service.url : `https://${service.url}`} target="_blank" rel="noreferrer">{service.url}</Link><span className="service-category">{categories.find((category) => category.id === service.categoryId)?.name ?? "Other"}</span></div>
        <div className="service-actions">
          <Button type="button" onClick={onEdit}><Pencil size={17} /> Edit</Button>
          <Button className="danger" type="button" onClick={onDelete}><Trash2 size={17} /> Delete</Button>
        </div>
      </section>
      <div className="list-title"><div><SectionTitle>Accounts</SectionTitle><span>{list.length} linked</span></div>{list.length > 0 && <Button className="manager-primary compact" type="button" onClick={onAdd}><Plus size={17} /> Add account</Button>}</div>
      <div className="account-list">
        {list.map((account) => (
          <Button className="account-row" type="button" key={account.id} onClick={() => onAccount(account.id)}>
            <span className="round-icon"><CircleUserRound size={20} /></span>
            <span className="row-copy"><strong>{account.username}</strong><small>{account.email}</small></span>
            <ChevronRight size={18} />
          </Button>
        ))}
      </div>
      {!list.length && <div className="empty-account-card"><EmptyState icon={<CircleUserRound size={27} />} title="No accounts yet" copy="Your service is ready. Add an account when you need one." /><Button className="manager-primary" type="button" onClick={onAdd}><Plus size={18} /> Add account</Button></div>}
    </>
  );
}

function AccountDetail({
  account,
  service,
  credentials,
  onBack,
  onEdit,
  onAddCredential,
  onCopy,
}: {
  account: Account;
  service?: Service;
  credentials: Credential[];
  onBack: () => void;
  onEdit: () => void;
  onAddCredential: () => void;
  onCopy: (value: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!revealed) return;
    const timer = window.setTimeout(() => setRevealed(false), 5000);
    return () => window.clearTimeout(timer);
  }, [revealed]);
  const entries = credentials.filter((item) => item.accountId === account.id && !item.deletedAt);
  const fields = [
    ["Username", account.username],
    ["Email", account.email],
    ["Account ID", account.accountId],
  ];
  return (
    <>
      <AppHeader title={account.username} eyebrow={service?.title ?? "Account"} onBack={onBack} action={<Button className="manager-secondary" type="button" onClick={onEdit}><Pencil size={17} /> Edit</Button>} />
      <section className="detail-card">
        {fields.map(([label, value]) => (
          <div className="data-field" key={label}>
            <span>{label}</span><strong>{value}</strong>
            <Button type="button" onClick={() => onCopy(value)} aria-label={`Copy ${label}`}><Copy size={17} /></Button>
          </div>
        ))}
        <div className="data-field password-data">
          <span>Password</span><strong>{revealed ? account.password : "••••••••••••••••"}</strong>
          <span className="field-actions">
            <Button type="button" onClick={() => setRevealed(!revealed)} aria-label={revealed ? "Hide password" : "Reveal password"}>{revealed ? <EyeOff size={18} /> : <Eye size={18} />}</Button>
            <Button type="button" onClick={() => onCopy(account.password)} aria-label="Copy password"><Copy size={17} /></Button>
          </span>
        </div>
        {revealed && <div className="reveal-note"><Eye size={14} /> Password hides automatically in 5 seconds</div>}
        <div className="detail-strength"><PasswordStrength value={account.password} /></div>
      </section>
      <div className="list-title"><div><SectionTitle>Credentials</SectionTitle><span>{entries.length} stored</span></div><Button className="manager-secondary compact" type="button" onClick={onAddCredential}><Plus size={17} /> Add</Button></div>
      <div className="credential-list">
        {entries.map((credential) => (
          <div className="credential-row" key={credential.id}>
            <span className="round-icon">{credential.type === "passkey" ? <Fingerprint size={20} /> : <FileKey2 size={20} />}</span>
            <span className="row-copy"><strong>{credential.label}</strong><small>{credential.details}</small></span>
            <span className="type-chip">{credential.type.replace("_", " ")}</span>
          </div>
        ))}
      </div>
      {!entries.length && <EmptyState icon={<KeyRound size={26} />} title="No credentials yet" copy="Add a passkey note, security question, or other recovery detail." />}
    </>
  );
}

type EditorProps = {
  kind: "service" | "account" | "credential";
  service?: Service;
  account?: Account;
  categories: Category[];
  onCategoryAdd: (name: string) => string | null;
  onBack: () => void;
  onSave: (data: Record<string, string>) => void;
};

function Editor({ kind, service, account, categories, onCategoryAdd, onBack, onSave }: EditorProps) {
  const isEdit = Boolean(service || account);
  const [title, setTitle] = useState(service?.title ?? "");
  const [url, setUrl] = useState(service?.url ?? "");
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? "other");
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [iconMode, setIconMode] = useState<Service["iconMode"]>(service?.iconMode ?? "automatic");
  const [iconImage, setIconImage] = useState(service?.iconImage ?? "");
  const [imageError, setImageError] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const fetchIcons = useContext(FetchIconsContext);
  const chooseImage = (file?: File) => {
    if (!file) return;
    setImageError("");
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) || file.size > 2 * 1024 * 1024) { setImageError("Choose a PNG, JPG, WebP, or GIF image under 2 MB."); return; }
    const reader = new FileReader();
    setImageLoading(true);
    reader.onload = () => { setIconImage(String(reader.result)); setIconMode("image"); setImageLoading(false); };
    reader.onerror = () => { setImageError("Could not read that image. Please try another."); setImageLoading(false); };
    reader.readAsDataURL(file);
  };
  const [username, setUsername] = useState(account?.username ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [accountId, setAccountId] = useState(account?.accountId ?? "");
  const [password, setPassword] = useState(account?.password ?? "");
  const [type, setType] = useState<Credential["type"]>("passkey");
  const [label, setLabel] = useState("");
  const [details, setDetails] = useState("");
  const generate = () => setPassword("Nebula!Maple#Orbit84");
  const valid = kind === "service" ? title.trim() && url.trim() && categories.some((category) => category.id === categoryId) && !imageLoading : kind === "account" ? username && password : label && details;
  return (
    <>
      <AppHeader title={`${isEdit ? "Edit" : "Add"} ${kind}`} eyebrow="Data manager" onBack={onBack} />
      <form className="editor-form" onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        onSave(kind === "service" ? { title: title.trim(), url: url.trim(), categoryId, iconMode, iconImage } : kind === "account" ? { username, email, accountId, password } : { type, label, details });
      }}>
        {kind === "service" && <>
          <label><span>Service name</span><TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. GitHub" autoFocus /></label>
          <label><span>Website URL</span><TextInput value={url} onChange={(event) => setUrl(event.target.value)} placeholder="github.com" /></label>
          <label><span>Category</span><Select aria-label="Category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setCategoryError(""); }}>
            {categories.map((category) => <Option key={category.id} value={category.id}>{category.name}</Option>)}<Option value="__new">New category</Option>
          </Select></label>
          {categoryId === "__new" && <div className="inline-category-editor"><label className="field-label"><span>New category name</span><TextInput value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="e.g. Travel" maxLength={40} /></label><Button className="manager-secondary" type="button" onClick={() => { const id = onCategoryAdd(newCategory); if (id) { setCategoryId(id); setNewCategory(""); setCategoryError(""); } else setCategoryError("Use a unique category name (not All)."); }} disabled={!newCategory.trim()}><Plus size={17} /> Add category</Button>{categoryError && <p className="inline-error" role="alert">{categoryError}</p>}</div>}
          <div className="service-icon-editor">
            <div className="icon-editor-heading"><ItemIcon title={title || "Service"} service={{ url, iconMode, iconImage }} /><div><strong>Icon</strong><small>{imageLoading ? "Reading image…" : "Preview updates as you choose"}</small></div></div>
            <div className="icon-options" role="group" aria-label="Service icon options">
              <Button type="button" aria-pressed={iconMode === "automatic"} onClick={() => { setIconMode("automatic"); setImageError(""); }}>Automatic</Button>
              <Button type="button" aria-pressed={iconMode === "image"} onClick={() => fileInput.current?.click()}><Image size={15} /> Choose image</Button>
              <Button type="button" aria-pressed={iconMode === "letter"} onClick={() => { setIconMode("letter"); setImageError(""); }}>Use letter</Button>
            </div>
            <TextInput className="icon-file-input" type="file" ref={fileInput} aria-label="Icon image" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { chooseImage(event.target.files?.[0]); event.target.value = ""; }} />
            <p className="icon-note">{iconMode === "automatic" ? fetchIcons ? "Uses the website domain. Online icon lookup is enabled." : "Uses a local logo when available; otherwise a letter. Online lookup is off." : iconMode === "image" ? "Your image stays in this prototype’s local state." : "Uses the first letter of the service name."}</p>
            {imageError && <p className="inline-error" role="alert">{imageError}</p>}
          </div>
        </>}
        {kind === "account" && <>
          <label><span>Username</span><TextInput value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" autoFocus /></label>
          <label><span>Email</span><TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label><span>Account ID</span><TextInput value={accountId} onChange={(event) => setAccountId(event.target.value)} placeholder="Optional account identifier" /></label>
          <label><span>Password</span><span className="generate-field"><TextInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter a strong password" /><Button type="button" onClick={generate}><WandSparkles size={16} /> Generate</Button></span></label>
          {password && <PasswordStrength value={password} />}
        </>}
        {kind === "credential" && <>
          <label><span>Credential type</span><Select value={type} onChange={(event) => setType(event.target.value as Credential["type"])}>
            <Option value="passkey">Passkey</Option><Option value="security_question">Security Question</Option><Option value="other">Other</Option>
          </Select></label>
          {type === "passkey" && <div className="info-banner"><ShieldCheck size={19} /><p><strong>Information only</strong>Krypteia stores details about the passkey—not the passkey itself.</p></div>}
          <label><span>Label</span><TextInput value={label} onChange={(event) => setLabel(event.target.value)} placeholder={type === "passkey" ? "e.g. iPhone passkey" : "Credential label"} /></label>
          <label><span>Details</span><TextArea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Add useful context" /></label>
        </>}
        <Button className="manager-primary full" type="submit" disabled={!valid}><Check size={18} /> Save {kind}</Button>
      </form>
    </>
  );
}

function ConfirmDelete({ name, cascades, onCancel, onConfirm }: { name: string; cascades?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <span className="danger-emblem"><Trash2 size={24} /></span>
        <SectionTitle id="delete-title">Move {name} to Recycle Bin?</SectionTitle>
        <p>It can be restored for 30 days. After that, it will be permanently deleted automatically.</p>
        {cascades && <div className="modal-warning">All accounts and credentials inside this service will move with it.</div>}
        <div><Button className="manager-secondary" type="button" onClick={onCancel}>Cancel</Button><Button className="danger-button" type="button" onClick={onConfirm}>Move to Bin</Button></div>
      </section>
    </div>
  );
}

function RecycleBin({
  services,
  accounts,
  onRestore,
  onPermanent,
}: {
  services: Service[];
  accounts: Account[];
  onRestore: (kind: "service" | "account", id: string) => void;
  onPermanent: (kind: "service" | "account", id: string) => void;
}) {
  const deleted = binItems(services, accounts);
  return (
    <>
      <AppHeader title="Recycle Bin" eyebrow="30-day retention" />
      <div className="bin-notice"><ArchiveRestore size={19} /><p>Deleted items are automatically removed after 30 days.</p></div>
      <div className="bin-list">
        {deleted.map((item) => {
          const days = retentionDays(item.deletedAt!);
          return <div className="bin-row" key={`${item.kind}-${item.id}`}>
            <ItemIcon title={item.title} service={item.kind === "service" ? item : undefined} />
            <span className="row-copy"><strong>{item.title}</strong><small>{item.subtitle}</small></span>
            <span className={`days-chip ${days <= 7 ? "urgent" : ""}`}>{days} days left</span>
            <span className="bin-actions">
              <Button type="button" onClick={() => onRestore(item.kind, item.id)}><RotateCcw size={16} /> Restore</Button>
              <Button className="danger" type="button" onClick={() => onPermanent(item.kind, item.id)}><Trash2 size={16} /> Delete</Button>
            </span>
          </div>;
        })}
      </div>
      {!deleted.length && <EmptyState icon={<Trash2 size={27} />} title="Recycle Bin is empty" copy="Deleted vault items will appear here for 30 days." />}
    </>
  );
}

function PermanentDelete({ vaultKey, onCancel, onConfirm }: { vaultKey: string; onCancel: () => void; onConfirm: () => void }) {
  const [key, setKey] = useState("");
  const [attempted, setAttempted] = useState(false);
  return <div className="modal-backdrop"><form className="confirm-modal" onSubmit={(event) => {
    event.preventDefault();
    if (key === vaultKey) onConfirm(); else setAttempted(true);
  }}>
    <span className="danger-emblem"><LockKeyhole size={24} /></span>
    <SectionTitle>Delete permanently?</SectionTitle><p>This cannot be undone. Enter your Vault Key to confirm.</p>
    <label className="field-label"><span>Vault Key</span><TextInput type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="Enter Vault Key" autoFocus /></label>
    {attempted && <span className="inline-error">Incorrect Vault Key.</span>}
    <div><Button className="manager-secondary" type="button" onClick={onCancel}>Cancel</Button><Button className="danger-button" type="submit">Delete forever</Button></div>
  </form></div>;
}

function Toggle({ active, onChange, label }: { active: boolean; onChange?: () => void; label: string }) {
  return <Button className={`setting-toggle ${active ? "active" : ""}`} type="button" role="switch" aria-checked={active} aria-label={label} onClick={onChange}><span /></Button>;
}

function Generator({ onCopy }: { onCopy: (value: string) => void }) {
  const [length, setLength] = useState(20);
  const [options, setOptions] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true });
  const [nonce, setNonce] = useState(0);
  const password = useMemo(() => {
    const sets = [
      options.uppercase ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "",
      options.lowercase ? "abcdefghijkmnopqrstuvwxyz" : "",
      options.numbers ? "23456789" : "",
      options.symbols ? "!@#$%&*+-=?" : "",
    ].filter(Boolean);
    const source = sets.join("") || "abcdefghijkmnopqrstuvwxyz";
    let seed = 911 + length * 37 + nonce * 101;
    const next = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const required = sets.map((set) => set[Math.floor(next() * set.length)]);
    const rest = Array.from({ length: Math.max(0, length - required.length) }, () => source[Math.floor(next() * source.length)]);
    return [...required, ...rest].sort(() => next() - .5).join("");
  }, [length, options, nonce]);
  const updateOption = (key: keyof typeof options) => {
    const enabled = Object.values(options).filter(Boolean).length;
    if (options[key] && enabled === 1) return;
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  };
  return <>
    <AppHeader title="Generator" eyebrow="Security tools" />
    <section className="generator-card">
      <div className="generated-output"><span>Generated password</span><code>{password}</code></div>
      <PasswordStrength value={password} />
      <div className="generator-actions">
        <Button className="manager-secondary" type="button" onClick={() => setNonce((value) => value + 1)}><History size={17} /> Regenerate</Button>
        <Button className="manager-primary" type="button" onClick={() => onCopy(password)}><Copy size={17} /> Copy password</Button>
      </div>
    </section>
    <section className="generator-options">
      <div className="length-heading"><div><strong>Password length</strong><small>Longer passwords are more secure</small></div><output>{length}</output></div>
      <TextInput className="length-slider" type="range" min="8" max="64" value={length} onChange={(event) => setLength(Number(event.target.value))} aria-label="Password length" />
      <div className="range-labels"><span>8</span><span>64</span></div>
      <div className="option-list">
        {([
          ["uppercase", "Uppercase", "A–Z"],
          ["lowercase", "Lowercase", "a–z"],
          ["numbers", "Numbers", "0–9"],
          ["symbols", "Symbols", "!@#$"],
        ] as const).map(([key, label, sample]) => <div className="option-row" key={key}><span><strong>{label}</strong><small>{sample}</small></span><Toggle active={options[key]} onChange={() => updateOption(key)} label={`Include ${label}`} /></div>)}
      </div>
    </section>
  </>;
}

type SettingRowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value?: string;
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
  trailing?: React.ReactNode;
};

function SettingRow({ icon, title, subtitle, value, badge, disabled, onClick, trailing }: SettingRowProps) {
  return <div
    className={`setting-row ${disabled ? "disabled" : ""} ${onClick ? "clickable" : ""}`}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={disabled ? undefined : onClick}
    onKeyDown={(event) => { if (onClick && (event.key === "Enter" || event.key === " ")) onClick(); }}
  >
    <span className="setting-icon">{icon}</span>
    <span className="setting-copy"><strong>{title}{badge && <i>{badge}</i>}</strong><small>{subtitle}</small></span>
    {trailing ?? <span className="setting-value">{value}{onClick && <ChevronRight size={17} />}</span>}
  </div>;
}

function SettingsHome({
  onChangeKey,
  onRecovery,
  onReplay,
  onLock,
  recovery,
  onCategories,
  fetchIcons,
  onFetchIconsChange,
}: {
  onChangeKey: () => void;
  onRecovery: () => void;
  onReplay: () => void;
  onLock: () => void;
  recovery: RecoveryMethods;
  onCategories: () => void;
  fetchIcons: boolean;
  onFetchIconsChange: () => void;
}) {
  return <>
    <AppHeader title="Settings" eyebrow="Krypteia" />
    <div className="settings-group"><SectionTitle>Security</SectionTitle><div className="settings-list">
      <SettingRow icon={<KeyRound size={19} />} title="Change Vault Key" subtitle="Update the key that protects your vault" onClick={onChangeKey} />
      <SettingRow icon={<ShieldCheck size={19} />} title="Recovery settings" subtitle="Recovery Key and Security Questions" value={`${Number(recovery.questions) + Number(recovery.recoveryKey)} methods`} onClick={onRecovery} />
      <SettingRow icon={<LockKeyhole size={19} />} title="Auto-lock" subtitle="Locks when app goes to background" trailing={<Button className="inline-demo" type="button" onClick={(event) => { event.stopPropagation(); onLock(); }}>Simulate</Button>} />
      <SettingRow icon={<Copy size={19} />} title="Clipboard clear" subtitle="Copied secrets are removed automatically" value="30 seconds" />
      <SettingRow icon={<ShieldAlert size={19} />} title="Screenshot blocking" subtitle="Prevent screen captures while unlocked" trailing={<Toggle active label="Screenshot blocking" />} />
    </div></div>
    <div className="settings-group"><SectionTitle>Vault preferences</SectionTitle><div className="settings-list">
      <SettingRow icon={<Tags size={19} />} title="Manage categories" subtitle="Add, rename, or organize service categories" onClick={onCategories} />
      <SettingRow icon={<Image size={19} />} title="Fetch website icons online" subtitle="Off by default · local logos still work" trailing={<Toggle active={fetchIcons} onChange={onFetchIconsChange} label="Fetch website icons online" />} />
      <p className="icon-privacy-note">Looks up icons using the website domain. This tells the icon provider which sites you use.</p>
    </div></div>
    <div className="settings-group"><SectionTitle>Help</SectionTitle><div className="settings-list">
      <SettingRow icon={<BookOpen size={19} />} title="View tutorial again" subtitle="Replay the Krypteia introduction" onClick={onReplay} />
    </div></div>
    <div className="settings-group"><SectionTitle>Coming in V2</SectionTitle><div className="settings-list">
      <SettingRow disabled badge="Coming soon" icon={<Fingerprint size={19} />} title="Passkey recovery" subtitle="Recover with a passkey on a trusted device" />
      <SettingRow disabled badge="Coming soon" icon={<ShieldAlert size={19} />} title="Breach alerts" subtitle="Check accounts with Have I Been Pwned" />
      <SettingRow disabled badge="Coming soon" icon={<Import size={19} />} title="Import / Export" subtitle="Move data securely between vaults" />
      <SettingRow disabled badge="Coming soon" icon={<Bell size={19} />} title="Expiry notifications" subtitle="Recycle Bin deletion reminders" />
    </div></div>
    <div className="settings-group"><SectionTitle>About</SectionTitle><div className="about-card"><span className="brand-mark"><ShieldCheck size={20} /></span><span><strong>Krypteia</strong><small>Private by design</small></span><span>Version 1.0.0</span></div></div>
  </>;
}

function ManageCategories({ categories, services, onSave, onDelete, onBack }: {
  categories: Category[]; services: Service[]; onSave: (name: string, id?: string) => string | null; onDelete: (id: string) => void; onBack: () => void;
}) {
  const [editing, setEditing] = useState<{ id?: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Category | null>(null);
  return <>
    <AppHeader title="Manage categories" eyebrow="Vault preferences" onBack={onBack} action={<Button className="manager-secondary" type="button" onClick={() => { setEditing({ name: "" }); setError(""); setDeleting(null); }} aria-label="Add category"><Plus size={18} /></Button>} />
    <p className="category-help">Every service has one category. Other is the default and cannot be renamed or deleted.</p>
    {editing && <form className="category-editor" onSubmit={(event) => { event.preventDefault(); if (onSave(editing.name, editing.id)) { setEditing(null); setError(""); } else setError("Use a unique category name (not All)."); }}>
      <label className="field-label"><span>{editing.id ? "Rename category" : "New category name"}</span><TextInput value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} maxLength={40} placeholder="e.g. Travel" autoFocus /></label>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="category-editor-actions"><Button className="manager-secondary" type="button" onClick={() => setEditing(null)}>Cancel</Button><Button className="manager-primary" type="submit" disabled={!editing.name.trim()}><Check size={17} /> Save category</Button></div>
    </form>}
    {deleting && <section className="category-delete-card" role="alert" aria-label="Delete category confirmation"><strong>Delete {deleting.name}?</strong><p>All services in this category, including recycled services, will move to Other. No services or accounts will be deleted.</p><div className="category-editor-actions"><Button className="manager-secondary" type="button" onClick={() => setDeleting(null)}>Cancel</Button><Button className="danger-button" type="button" onClick={() => { onDelete(deleting.id); setDeleting(null); }}>Delete category</Button></div></section>}
    <div className="category-list">{categories.map((category) => <div className="category-row" key={category.id}><span className="round-icon"><Tags size={18} /></span><span className="row-copy"><strong>{category.name}</strong><small>{services.filter((service) => !service.deletedAt && service.categoryId === category.id).length} services</small></span>{category.id === "other" ? <span className="type-chip">Default</span> : <div className="category-row-actions"><Button className="icon-button" type="button" aria-label={`Rename ${category.name}`} onClick={() => { setEditing({ ...category }); setError(""); setDeleting(null); }}><Pencil size={17} /></Button><Button className="icon-button danger" type="button" aria-label={`Delete ${category.name}`} onClick={() => { setDeleting(category); setEditing(null); }}><Trash2 size={17} /></Button></div>}</div>)}</div>
  </>;
}

function RecoverySettings({ recovery, vaultKey, onChange, onBack }: { recovery: RecoveryMethods; vaultKey: string; onChange: (methods: RecoveryMethods) => void; onBack: () => void }) {
  const { questions, recoveryKey } = recovery;
  const [regenerating, setRegenerating] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [questionDrafts, setQuestionDrafts] = useState([
    { question: "What was the name of your first school?", answer: questions ? "Northfield" : "" },
    { question: "What street did you grow up on?", answer: questions ? "Willow Lane" : "" },
    { question: "Write your own question", answer: questions ? "Demo answer" : "" },
  ]);
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const confirmRegeneration = (event: React.FormEvent) => {
    event.preventDefault();
    if (key !== vaultKey) { setError("That Vault Key is incorrect."); return; }
    onChange({ ...recovery, recoveryKey: true });
    setRegenerating(false);
    setKey("");
    setError("");
  };
  return <>
    <AppHeader title="Recovery settings" eyebrow="Security" onBack={onBack} />
    <div className="info-banner"><ShieldCheck size={19} /><p><strong>Recovery only resets your Vault Key.</strong>It never opens or exposes your vault.</p></div>
    <div className="recovery-methods">
      <div className="recovery-method"><span className="round-icon"><FileKey2 size={20} /></span><span className="row-copy"><strong>Recovery Key</strong><small>{recoveryKey ? "Generated · stored outside Krypteia" : "Not configured"}</small></span><span className={`method-status ${recoveryKey ? "enabled" : ""}`}>{recoveryKey ? "Active" : "Not set up"}</span><div className="recovery-actions"><Button type="button" onClick={() => setRegenerating(true)}>{recoveryKey ? "Regenerate" : "Set up"}</Button><Button className="danger" type="button" disabled={!recoveryKey} onClick={() => onChange({ ...recovery, recoveryKey: false })}>Remove</Button></div></div>
      <div className="recovery-method"><span className="round-icon"><HelpCircle size={20} /></span><span className="row-copy"><strong>Security Questions</strong><small>{questions ? "3 questions configured" : "Not configured"}</small></span><span className={`method-status ${questions ? "enabled" : ""}`}>{questions ? "Active" : "Not set up"}</span><div className="recovery-actions"><Button type="button" onClick={() => setEditingQuestions(true)}>{questions ? "Edit" : "Set up"}</Button><Button className="danger" type="button" disabled={!questions} onClick={() => onChange({ ...recovery, questions: false })}>Remove</Button></div></div>
    </div>
    {regenerating && <form className="recovery-confirm-card" onSubmit={confirmRegeneration}><div className="flow-intro"><span className="round-icon"><LockKeyhole size={20} /></span><div><SectionTitle>{recoveryKey ? "Regenerate Recovery Key" : "Set up Recovery Key"}</SectionTitle><p>Enter your Vault Key to authorize this security change.</p></div></div>{recoveryKey && <div className="warning"><ShieldAlert size={18} /><p>Generating a new Recovery Key immediately stops the old key from working.</p></div>}<label className="field-label"><span>Vault Key</span><TextInput type="password" value={key} onChange={(event) => { setKey(event.target.value); setError(""); }} placeholder="Enter your Vault Key" autoFocus /></label>{error && <p className="inline-error">{error}</p>}<div className="recovery-confirm-actions"><Button className="manager-secondary" type="button" onClick={() => { setRegenerating(false); setKey(""); setError(""); }}>Cancel</Button><Button className="manager-primary" type="submit" disabled={!key}>{recoveryKey ? "Regenerate key" : "Generate key"}</Button></div></form>}
    {editingQuestions && <form className="recovery-confirm-card" onSubmit={(event) => { event.preventDefault(); onChange({ ...recovery, questions: true }); setEditingQuestions(false); }}><div className="flow-intro"><span className="round-icon"><HelpCircle size={20} /></span><div><SectionTitle>{questions ? "Edit Security Questions" : "Set up Security Questions"}</SectionTitle><p>Use at least three answers only you are likely to know.</p></div></div><div className="settings-question-list">{questionDrafts.map((draft, index) => <div className="settings-question" key={index}><label className="field-label"><span>Question {index + 1}</span><TextInput value={draft.question} onChange={(event) => setQuestionDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item))} /></label><label className="field-label"><span>Answer</span><TextInput value={draft.answer} onChange={(event) => setQuestionDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, answer: event.target.value } : item))} placeholder="Your answer" /></label></div>)}</div><div className="warning"><ShieldAlert size={18} /><p>Security Questions are weaker than your Vault Key. Avoid answers others could discover.</p></div><div className="recovery-confirm-actions"><Button className="manager-secondary" type="button" onClick={() => setEditingQuestions(false)}>Cancel</Button><Button className="manager-primary" type="submit" disabled={questionDrafts.some((item) => !item.question.trim() || !item.answer.trim())}>Save questions</Button></div></form>}
    {!questions && !recoveryKey && <div className="warning"><ShieldAlert size={18} /><p>Without a recovery method, a forgotten Vault Key cannot be reset.</p></div>}
  </>;
}

function ChangeVaultKey({
  vaultKey,
  onBack,
  onComplete,
}: {
  vaultKey: string;
  onBack: () => void;
  onComplete: (key: string) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [oldKey, setOldKey] = useState("");
  const [newKey, setNewKey] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const submitOld = (event: React.FormEvent) => { event.preventDefault(); if (oldKey === vaultKey) { setStep(2); setError(""); } else setError("That Vault Key is incorrect."); };
  if (step === 4) return <>
    <AppHeader title="Vault Key changed" eyebrow="Security complete" />
    <div className="change-success"><span><CheckCircle2 size={38} /></span><SectionTitle>Your new key is ready</SectionTitle><p>Your vault remains protected. Use your new Vault Key the next time Krypteia locks.</p><Button className="manager-primary full" type="button" onClick={() => onComplete(newKey)}>Return to settings</Button></div>
  </>;
  return <>
    <AppHeader title="Change Vault Key" eyebrow={`Step ${step} of 3`} onBack={step === 1 ? onBack : () => setStep((step - 1) as 1 | 2 | 3)} />
    <div className="flow-progress">{[1, 2, 3].map((item) => <span key={item} className={item <= step ? "active" : ""} />)}</div>
    {step === 1 && <form className="editor-form key-flow" onSubmit={submitOld}><div className="flow-intro"><span className="round-icon"><LockKeyhole size={20} /></span><div><SectionTitle>Verify your current key</SectionTitle><p>Enter your existing Vault Key before making a security change.</p></div></div><label><span>Current Vault Key</span><TextInput type="password" value={oldKey} onChange={(event) => { setOldKey(event.target.value); setError(""); }} placeholder="Enter current Vault Key" autoFocus /></label>{error && <span className="inline-error">{error}</span>}<Button className="manager-primary full" type="submit" disabled={!oldKey}>Continue <ChevronRight size={17} /></Button></form>}
    {step === 2 && <div className="editor-form key-flow"><div className="flow-intro"><span className="round-icon"><KeyRound size={20} /></span><div><SectionTitle>Create your new key</SectionTitle><p>Choose a key that is both strong and memorable.</p></div></div><label><span>New Vault Key</span><TextInput type="password" value={newKey} onChange={(event) => setNewKey(event.target.value)} placeholder="Enter a memorable passphrase" autoFocus /></label>{newKey && <PasswordStrength value={newKey} />}<div className="guidance-card"><span className="guidance-icon"><Sparkles size={18} /></span><div><strong>Make it strong, make it yours</strong><p>Use a long, memorable passphrase you haven’t used anywhere else.</p></div></div><Button className="manager-primary full" type="button" disabled={newKey.length < 8} onClick={() => setStep(3)}>Continue <ChevronRight size={17} /></Button></div>}
    {step === 3 && <form className="editor-form key-flow" onSubmit={(event) => { event.preventDefault(); if (confirm === newKey) { setStep(4); setError(""); } else setError("Vault Keys don’t match."); }}><div className="flow-intro"><span className="round-icon"><Check size={20} /></span><div><SectionTitle>Confirm your new key</SectionTitle><p>Re-enter your new Vault Key to make sure it’s correct.</p></div></div><label><span>Confirm new Vault Key</span><TextInput type="password" value={confirm} onChange={(event) => { setConfirm(event.target.value); setError(""); }} placeholder="Re-enter new Vault Key" autoFocus /></label>{error && <span className="inline-error">{error}</span>}<div className="warning"><ShieldAlert size={18} /><p>This immediately replaces your current Vault Key.</p></div><Button className="manager-primary full" type="submit" disabled={!confirm}>Change Vault Key <Check size={17} /></Button></form>}
  </>;
}

const navItems = [
  { id: "home" as const, label: "Home", icon: House },
  { id: "vault" as const, label: "Vault", icon: Vault },
  { id: "generator" as const, label: "Generator", icon: WandSparkles },
  { id: "bin" as const, label: "Recycle Bin", icon: Trash2 },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export default function DataManager({
  vaultKey,
  onLock,
  onReplayTutorial,
  onVaultKeyChange,
  recovery,
  onRecoveryChange,
}: {
  vaultKey: string;
  onLock: () => void;
  onReplayTutorial: () => void;
  onVaultKeyChange: (key: string) => void;
  recovery: RecoveryMethods;
  onRecoveryChange: (methods: RecoveryMethods) => void;
}) {
  const [tab, setTab] = useState<Tab>("home");
  const [view, setView] = useState<View>({ name: "home" });
  const [services, setServices] = useState(mockServices);
  const [accounts, setAccounts] = useState(mockAccounts);
  const [credentials, setCredentials] = useState(mockCredentials);
  const [categories, setCategories] = useState(mockCategories);
  const [fetchIcons, setFetchIcons] = useState(false);
  const saveCategory = (rawName: string, id?: string) => {
    const name = rawName.trim();
    if (!name || name.length > 40 || name.toLowerCase() === "all" || id === "other" || categories.some((category) => category.id !== id && category.name.toLowerCase() === name.toLowerCase())) return null;
    const categoryId = id ?? `category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setCategories((list) => id ? list.map((category) => category.id === id ? { ...category, name } : category) : [...list, { id: categoryId, name }]);
    return categoryId;
  };
  const deleteCategory = (id: string) => {
    if (id === "other") return;
    setServices((list) => list.map((service) => service.categoryId === id ? { ...service, categoryId: "other" } : service));
    setCategories((list) => list.filter((category) => category.id !== id));
  };
  const [activity, setActivity] = useState(mockActivity);
  const [accountFilter, setAccountFilter] = useState<AccountFilter | null>(null);
  const recordActivity = (label: string) => setActivity((list) => [{ id: `activity-${Date.now()}-${Math.random()}`, label, timestamp: Date.now() }, ...list].slice(0, 5));
  const [toast, setToast] = useState("");
  const [deleting, setDeleting] = useState<{ kind: "service" | "account"; id: string; name: string } | null>(null);
  const [permanent, setPermanent] = useState<{ kind: "service" | "account"; id: string } | null>(null);
  const selectedService = view.name === "service" ? services.find((item) => item.id === view.id) : undefined;
  const selectedAccount = view.name === "account" ? accounts.find((item) => item.id === view.id) : undefined;
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { /* Clipboard may be blocked in preview. */ }
    setToast("Copied. Clipboard clears in 30 seconds");
    window.setTimeout(() => setToast(""), 3000);
    window.setTimeout(() => navigator.clipboard?.writeText("").catch(() => {}), 30000);
  };
  const selectTab = (next: Tab) => { setTab(next); setView({ name: "home" }); setAccountFilter(null); };
  const content = useMemo(() => {
    if (tab === "home") return <HomeScreen services={services} accounts={accounts} recovery={recovery} activity={activity} onFilter={(filter) => { setTab("vault"); setAccountFilter(filter); setView({ name: "filtered-accounts", filter }); }} onBin={() => selectTab("bin")} onRecovery={() => { setTab("settings"); setView({ name: "recovery-settings" }); }} onAdd={() => { setTab("vault"); setView({ name: "form", kind: "service" }); }} onGenerate={() => selectTab("generator")} />;
    if (tab === "bin") return <RecycleBin services={services} accounts={accounts} onRestore={(kind, id) => {
      recordActivity(`Restored ${kind === "service" ? services.find((item) => item.id === id)?.title : accounts.find((item) => item.id === id)?.username}`);
      if (kind === "service") {
        setServices((list) => list.map((item) => item.id === id ? { ...item, deletedAt: null } : item));
        setAccounts((list) => list.map((item) => item.serviceId === id ? { ...item, deletedAt: null } : item));
        const linked = accounts.filter((item) => item.serviceId === id).map((item) => item.id);
        setCredentials((list) => list.map((item) => linked.includes(item.accountId) ? { ...item, deletedAt: null } : item));
      } else setAccounts((list) => list.map((item) => item.id === id ? { ...item, deletedAt: null } : item));
    }} onPermanent={(kind, id) => setPermanent({ kind, id })} />;
    if (tab === "generator") return <Generator onCopy={copy} />;
    if (tab === "settings") {
      if (view.name === "categories") return <ManageCategories categories={categories} services={services} onSave={saveCategory} onDelete={deleteCategory} onBack={() => setView({ name: "home" })} />;
      if (view.name === "change-key") return <ChangeVaultKey vaultKey={vaultKey} onBack={() => setView({ name: "home" })} onComplete={(key) => { onVaultKeyChange(key); recordActivity("Changed Vault Key"); setView({ name: "home" }); setToast("Vault Key changed successfully"); }} />;
      if (view.name === "recovery-settings") return <RecoverySettings recovery={recovery} vaultKey={vaultKey} onChange={(methods) => { onRecoveryChange(methods); recordActivity("Updated recovery settings"); }} onBack={() => setView({ name: "home" })} />;
      return <SettingsHome recovery={recovery} onCategories={() => setView({ name: "categories" })} fetchIcons={fetchIcons} onFetchIconsChange={() => setFetchIcons((enabled) => !enabled)} onChangeKey={() => setView({ name: "change-key" })} onRecovery={() => setView({ name: "recovery-settings" })} onReplay={onReplayTutorial} onLock={onLock} />;
    }
    if (view.name === "filtered-accounts") return <FilteredAccounts filter={view.filter} services={services} accounts={accounts} onBack={() => selectTab("home")} onAccount={(id) => setView({ name: "account", id })} />;
    if (view.name === "home") return <VaultHome services={services} accounts={accounts} categories={categories} onService={(id) => setView({ name: "service", id })} onAdd={() => setView({ name: "form", kind: "service" })} />;
    if (view.name === "service" && selectedService) return <ServiceDetail service={selectedService} accounts={accounts} categories={categories} onBack={() => setView({ name: "home" })} onAccount={(id) => setView({ name: "account", id })} onAdd={() => setView({ name: "form", kind: "account", parentId: selectedService.id })} onEdit={() => setView({ name: "form", kind: "service", id: selectedService.id })} onDelete={() => setDeleting({ kind: "service", id: selectedService.id, name: selectedService.title })} />;
    if (view.name === "account" && selectedAccount) return <AccountDetail account={selectedAccount} service={services.find((item) => item.id === selectedAccount.serviceId)} credentials={credentials} onBack={() => setView(accountFilter ? { name: "filtered-accounts", filter: accountFilter } : { name: "service", id: selectedAccount.serviceId })} onEdit={() => setView({ name: "form", kind: "account", id: selectedAccount.id, parentId: selectedAccount.serviceId })} onAddCredential={() => setView({ name: "form", kind: "credential", parentId: selectedAccount.id })} onCopy={copy} />;
    if (view.name === "form") {
      const editingService = view.kind === "service" && view.id ? services.find((item) => item.id === view.id) : undefined;
      const editingAccount = view.kind === "account" && view.id ? accounts.find((item) => item.id === view.id) : undefined;
      const back = () => setView(view.kind === "service" ? view.id ? { name: "service", id: view.id } : { name: "home" } : view.kind === "account" ? view.id ? { name: "account", id: view.id } : { name: "service", id: view.parentId! } : { name: "account", id: view.parentId! });
      return <Editor kind={view.kind} service={editingService} account={editingAccount} categories={categories} onCategoryAdd={saveCategory} onBack={back} onSave={(data) => {
        const parentTitle = services.find((item) => item.id === view.parentId)?.title ?? "service";
        recordActivity(view.kind === "service" ? `${view.id ? "Edited" : "Added"} ${data.title}` : view.kind === "account" ? `${view.id ? "Edited account in" : "Added account to"} ${parentTitle}` : `Added credential to ${accounts.find((item) => item.id === view.parentId)?.username ?? "account"}`);
        if (view.kind === "service") {
          const serviceData = { title: data.title, url: data.url, categoryId: data.categoryId, iconMode: data.iconMode as Service["iconMode"], iconImage: data.iconImage };
          if (view.id) setServices((list) => list.map((item) => item.id === view.id ? { ...item, ...serviceData } : item));
          else {
            const id = `svc-${Date.now()}`;
            setServices((list) => [...list, { id, ...serviceData, deletedAt: null }]);
          }
        } else if (view.kind === "account") {
          if (view.id) setAccounts((list) => list.map((item) => item.id === view.id ? { ...item, ...data } : item));
          else setAccounts((list) => [...list, { id: `acc-${Date.now()}`, serviceId: view.parentId!, username: data.username, email: data.email, accountId: data.accountId, password: data.password, deletedAt: null }]);
        } else setCredentials((list) => [...list, { id: `cred-${Date.now()}`, accountId: view.parentId!, type: data.type as Credential["type"], label: data.label, details: data.details, deletedAt: null }]);
        back();
      }} />;
    }
    return null;
  }, [tab, view, services, accounts, credentials, selectedService, selectedAccount, vaultKey, recovery, activity, accountFilter, categories, fetchIcons]);
  return (
    <FetchIconsContext.Provider value={fetchIcons}>
    <div className="manager-shell">
      <aside className="side-nav"><div className="manager-brand"><ShieldCheck size={22} /><strong>Krypteia</strong></div><nav>{navItems.map(({ id, label, icon: Icon }) => <Button type="button" key={id} className={tab === id ? "active" : ""} onClick={() => selectTab(id)}><Icon size={20} /><span>{label}</span>{id === "bin" && services.some((item) => item.deletedAt) && <i />}</Button>)}</nav><div className="nav-security"><ShieldCheck size={17} /><span><strong>Vault secured</strong><small>Local encryption</small></span></div></aside>
      <main className="manager-main">{content}</main>
      <nav className="bottom-nav">{navItems.map(({ id, label, icon: Icon }) => <Button type="button" key={id} className={tab === id ? "active" : ""} onClick={() => selectTab(id)}><Icon size={20} /><span>{label}</span></Button>)}</nav>
      {deleting && <ConfirmDelete name={deleting.name} cascades={deleting.kind === "service"} onCancel={() => setDeleting(null)} onConfirm={() => {
        const deletedAt = new Date().toISOString();
        recordActivity(`Moved ${deleting.name} to Recycle Bin`);
        if (deleting.kind === "service") {
          setServices((list) => list.map((item) => item.id === deleting.id ? { ...item, deletedAt } : item));
          const linked = accounts.filter((item) => item.serviceId === deleting.id).map((item) => item.id);
          setAccounts((list) => list.map((item) => item.serviceId === deleting.id ? { ...item, deletedAt } : item));
          setCredentials((list) => list.map((item) => linked.includes(item.accountId) ? { ...item, deletedAt } : item));
          setView({ name: "home" });
        }
        setDeleting(null);
      }} />}
      {permanent && <PermanentDelete vaultKey={vaultKey} onCancel={() => setPermanent(null)} onConfirm={() => {
        recordActivity(`Permanently deleted ${permanent.kind === "service" ? services.find((item) => item.id === permanent.id)?.title : accounts.find((item) => item.id === permanent.id)?.username}`);
        if (permanent.kind === "service") {
          const linked = accounts.filter((item) => item.serviceId === permanent.id).map((item) => item.id);
          setServices((list) => list.filter((item) => item.id !== permanent.id));
          setAccounts((list) => list.filter((item) => item.serviceId !== permanent.id));
          setCredentials((list) => list.filter((item) => !linked.includes(item.accountId)));
        } else setAccounts((list) => list.filter((item) => item.id !== permanent.id));
        setPermanent(null);
      }} />}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
    </FetchIconsContext.Provider>
  );
}
