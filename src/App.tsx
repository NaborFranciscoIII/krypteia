import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Eye,
  EyeOff,
  FileKey2,
  KeyRound,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { mockRecoveryKey, mockRecoveryMethods, recoveryQuestions, tutorialSlides, type RecoveryMethods } from "./mockData";
import DataManager from "./DataManager";

type Screen =
  | "tutorial"
  | "tutorial-replay"
  | "create"
  | "recovery-setup"
  | "unlock"
  | "recover-verify"
  | "recover-reset"
  | "recover-success"
  | "manager";

type Strength = {
  label: "Weak" | "Fair" | "Good" | "Strong";
  score: number;
  tone: string;
};

const iconMap = {
  key: KeyRound,
  layers: Sparkles,
  trash: Trash2,
  privacy: ShieldCheck,
};

function getStrength(value: string): Strength {
  let points = 0;
  if (value.length >= 8) points += 1;
  if (value.length >= 13) points += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) points += 1;
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) points += 1;
  if (value.length >= 18) points += 1;
  if (points <= 1) return { label: "Weak", score: 1, tone: "error" };
  if (points === 2) return { label: "Fair", score: 2, tone: "warning" };
  if (points === 3) return { label: "Good", score: 3, tone: "good" };
  return { label: "Strong", score: 4, tone: "success" };
}

function Brand() {
  return (
    <div className="brand" aria-label="Krypteia">
      <span className="brand-mark">
        <ShieldCheck size={20} strokeWidth={1.8} />
      </span>
      <span>Krypteia</span>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className="icon-button" type="button" onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  error,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: boolean;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field-label">
      <span>{label}</span>
      <span className={`input-wrap ${error ? "input-error" : ""}`}>
        <input
          autoFocus={autoFocus}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
        />
        <IconButton label={visible ? "Hide Vault Key" : "Show Vault Key"} onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </IconButton>
      </span>
    </label>
  );
}

function StrengthMeter({ value }: { value: string }) {
  const strength = getStrength(value);
  return (
    <div className="strength" aria-live="polite">
      <div className="strength-copy">
        <span>Key strength</span>
        <strong className={`tone-${strength.tone}`}>{value ? strength.label : "—"}</strong>
      </div>
      <div className="strength-track">
        {[1, 2, 3, 4].map((item) => (
          <span
            key={item}
            className={value && item <= strength.score ? `active ${strength.tone}` : ""}
          />
        ))}
      </div>
    </div>
  );
}

function GuidanceCard() {
  return (
    <div className="guidance-card">
      <span className="guidance-icon">
        <Sparkles size={18} />
      </span>
      <div>
        <strong>Make it strong, make it yours</strong>
        <p>Use a long, memorable passphrase you haven’t used anywhere else.</p>
      </div>
    </div>
  );
}

function StepHeader({
  step,
  title,
  description,
  onBack,
}: {
  step: string;
  title: string;
  description: string;
  onBack?: () => void;
}) {
  return (
    <>
      <div className="step-top">
        {onBack ? (
          <IconButton label="Go back" onClick={onBack}>
            <ArrowLeft size={20} />
          </IconButton>
        ) : (
          <span />
        )}
        <span className="step-pill">{step}</span>
      </div>
      <div className="title-block">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </>
  );
}

function KeyForm({
  action,
  onSubmit,
  initial = "",
}: {
  action: string;
  onSubmit: (key: string) => void;
  initial?: string;
}) {
  const [key, setKey] = useState(initial);
  const [confirm, setConfirm] = useState("");
  const canContinue = key.length >= 8 && key === confirm;
  return (
    <form
      className="form-stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (canContinue) onSubmit(key);
      }}
    >
      <PasswordField label="Vault Key" value={key} onChange={setKey} placeholder="Enter a memorable passphrase" />
      <StrengthMeter value={key} />
      <GuidanceCard />
      <PasswordField
        label="Confirm Vault Key"
        value={confirm}
        onChange={setConfirm}
        placeholder="Re-enter your Vault Key"
        error={confirm.length > 0 && key !== confirm}
      />
      {confirm.length > 0 && key !== confirm && <p className="inline-error">Vault Keys don’t match yet.</p>}
      <div className="warning">
        <CircleHelp size={18} />
        <p>If you forget your Vault Key without recovery set up, your vault data cannot be recovered.</p>
      </div>
      <button className="primary-button" type="submit" disabled={!canContinue}>
        {action}
        <ArrowRight size={19} />
      </button>
    </form>
  );
}

function Tutorial({ onDone }: { onDone: () => void }) {
  const [slide, setSlide] = useState(0);
  const startX = useRef<number | null>(null);
  const data = tutorialSlides[slide];
  const Icon = iconMap[data.icon as keyof typeof iconMap];
  const next = () => (slide === tutorialSlides.length - 1 ? onDone() : setSlide(slide + 1));

  return (
    <main
      className="tutorial-shell"
      onTouchStart={(event) => (startX.current = event.touches[0].clientX)}
      onTouchEnd={(event) => {
        if (startX.current === null) return;
        const delta = event.changedTouches[0].clientX - startX.current;
        if (delta < -45) next();
        if (delta > 45 && slide > 0) setSlide(slide - 1);
        startX.current = null;
      }}
    >
      <header className="tutorial-header">
        <Brand />
        <button className="text-button" type="button" onClick={onDone}>
          Skip
        </button>
      </header>
      <section className="tutorial-content" key={slide}>
        <div className="orbital-graphic" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="hero-icon">
            <Icon size={42} strokeWidth={1.5} />
          </span>
          <span className="orbit-dot dot-one" />
          <span className="orbit-dot dot-two" />
        </div>
        <span className="eyebrow">{data.eyebrow}</span>
        <h1>{data.title}</h1>
        <p>{data.description}</p>
      </section>
      <footer className="tutorial-footer">
        <div className="dots" aria-label={`Slide ${slide + 1} of ${tutorialSlides.length}`}>
          {tutorialSlides.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={index === slide ? "active" : ""}
              onClick={() => setSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        <button className="primary-button" type="button" onClick={next}>
          {slide === tutorialSlides.length - 1 ? "Get started" : "Next"}
          <ArrowRight size={19} />
        </button>
      </footer>
    </main>
  );
}

function RecoveryKeySetup({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [stored, setStored] = useState(false);
  const [blocks, setBlocks] = useState(["", ""]);
  const requested = [3, 7];
  const matches = blocks.every((value, index) => value.trim().toUpperCase() === mockRecoveryKey[requested[index] - 1]);

  if (step === 4) return (
    <div className="recovery-key-flow recovery-key-success">
      <span className="success-emblem"><CheckCircle2 size={38} /></span>
      <span className="eyebrow">Recovery Key ready</span>
      <h2>Your secure fallback is set</h2>
      <p>You can now reset a forgotten Vault Key without opening or exposing your vault.</p>
      <button className="primary-button" type="button" onClick={onComplete}>Continue <ArrowRight size={19} /></button>
    </div>
  );

  return (
    <div className="recovery-key-flow">
      <div className="flow-progress">{[1, 2, 3].map((item) => <span key={item} className={item <= step ? "active" : ""} />)}</div>
      <div className="method-heading static key-flow-heading">
        <span className="method-icon"><FileKey2 size={20} /></span>
        <span><strong>{step === 1 ? "Create a Recovery Key" : step === 2 ? "Store your key safely" : "Confirm two blocks"}</strong><small>Step {step} of 3</small></span>
      </div>
      {step === 1 && <>
        <p className="flow-copy">A Recovery Key is a one-time generated fallback that lets you reset your Vault Key if you forget it. It cannot unlock the vault by itself.</p>
        <div className="info-banner"><ShieldCheck size={19} /><p><strong>Strong and private</strong>The key is generated for this prototype and stays on this device.</p></div>
        <button className="primary-button" type="button" onClick={() => setStep(2)}><Sparkles size={18} /> Generate Recovery Key</button>
      </>}
      {step === 2 && <>
        <div className="recovery-key-blocks" aria-label="Mock Recovery Key">
          {mockRecoveryKey.map((block, index) => <code key={block}><span>{index + 1}</span>{block}</code>)}
        </div>
        <div className="key-warnings">
          <p><strong>Shown only once.</strong> You won’t be able to view this key again.</p>
          <p>Store it outside Krypteia, on paper or in another password manager.</p>
          <p>Anyone with this key can reset your Vault Key.</p>
          <p>Screenshots are blocked on this screen.</p>
        </div>
        <label className="safe-check"><input type="checkbox" checked={stored} onChange={(event) => setStored(event.target.checked)} /><span className="check-control">{stored && <Check size={16} />}</span><span>I stored it safely</span></label>
        <button className="primary-button" type="button" disabled={!stored} onClick={() => setStep(3)}>Confirm my key <ArrowRight size={19} /></button>
      </>}
      {step === 3 && <>
        <p className="flow-copy">Enter the requested blocks exactly as shown to confirm you saved the key.</p>
        <div className="confirm-blocks">
          {requested.map((block, index) => <label className="field-label" key={block}><span>Block {block}</span><input value={blocks[index]} maxLength={5} autoCapitalize="characters" onChange={(event) => { const next = [...blocks]; next[index] = event.target.value.toUpperCase(); setBlocks(next); }} placeholder="XXXXX" autoFocus={index === 0} /></label>)}
        </div>
        <button className="primary-button" type="button" disabled={!matches} onClick={() => setStep(4)}>Verify Recovery Key <Check size={19} /></button>
      </>}
      <button className="text-button muted" type="button" onClick={step === 1 ? onBack : () => setStep((step - 1) as 1 | 2 | 3)}>Back</button>
    </div>
  );
}

function SetupRecovery({ onDone, onBack }: { onDone: (methods: RecoveryMethods) => void; onBack: () => void }) {
  const [mode, setMode] = useState<"choose" | "key" | "questions">("choose");
  const [answers, setAnswers] = useState(["", "", ""]);
  const [questions, setQuestions] = useState(recoveryQuestions.slice(0, 3).map((item) => item.question));

  if (mode === "key") return (
    <main className="app-shell"><div className="ambient ambient-one" /><div className="page-card wide-card">
      <StepHeader step="Recovery Key" title="Set up recovery" description="Create a strong fallback for a forgotten Vault Key." onBack={() => setMode("choose")} />
      <RecoveryKeySetup onBack={() => setMode("choose")} onComplete={() => onDone({ recoveryKey: true, questions: false })} />
    </div></main>
  );

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="page-card wide-card">
        <StepHeader
          step="Step 2 of 2"
          title="Set up recovery"
          description="Give yourself a secure way back in. You can skip this, but we don’t recommend it."
          onBack={onBack}
        />
        <div className="recovery-choice-grid">
          <button className="recovery-choice recommended" type="button" onClick={() => setMode("key")}>
            <span className="method-icon"><FileKey2 size={21} /></span>
            <span><strong>Recovery Key</strong><small>Generate a key to store offline</small></span>
            <span className="choice-label strong-label">Strong, recommended</span>
            <ArrowRight size={19} />
          </button>
          <button className={`recovery-choice ${mode === "questions" ? "selected-choice" : ""}`} type="button" onClick={() => setMode(mode === "questions" ? "choose" : "questions")}>
            <span className="method-icon warning-icon"><CircleHelp size={21} /></span>
            <span><strong>Security Questions</strong><small>Minimum 3 · write your own</small></span>
            <span className="choice-label weak-label">Weaker than your Vault Key</span>
            <ChevronDown className={mode === "questions" ? "rotated" : ""} size={19} />
          </button>
        </div>
        {mode === "questions" && <div className="method-card selected-choice">
            <div className="questions">
              {answers.map((answer, index) => (
                <div className="question-row" key={index}>
                  <label className="field-label">
                    <span>Question {index + 1}</span>
                    <span className="select-wrap">
                      <select
                        value={questions[index]}
                        onChange={(event) => {
                          const next = [...questions];
                          next[index] = event.target.value;
                          setQuestions(next);
                        }}
                      >
                        {recoveryQuestions.map((item) => (
                          <option key={item.id}>{item.question}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} />
                    </span>
                  </label>
                  {questions[index] === "Write my own question" && (
                    <input className="standalone-input" placeholder="Type your question" />
                  )}
                  <input
                    className="standalone-input"
                    value={answer}
                    onChange={(event) => {
                      const next = [...answers];
                      next[index] = event.target.value;
                      setAnswers(next);
                    }}
                    placeholder="Your answer"
                  />
                </div>
              ))}
              <button
                type="button"
                className="secondary-button compact"
                onClick={() => {
                  setAnswers([...answers, ""]);
                  setQuestions([...questions, "Write my own question"]);
                }}
              >
                <Plus size={17} /> Add question
              </button>
            </div>
        </div>}
        <div className="action-stack">
          <button
            className="primary-button"
            type="button"
            onClick={() => onDone({ questions: true, recoveryKey: false })}
            disabled={mode !== "questions" || answers.filter(Boolean).length < 3}
          >
            Save Security Questions <ArrowRight size={19} />
          </button>
          <button className="text-button muted" type="button" onClick={() => onDone({ questions: false, recoveryKey: false })}>
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}

function Unlock({
  vaultKey,
  onForgot,
  onUnlocked,
}: {
  vaultKey: string;
  onForgot: () => void;
  onUnlocked: () => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [delay, setDelay] = useState(0);
  useEffect(() => {
    if (!delay) return;
    const timer = window.setInterval(() => setDelay((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [delay]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (input !== vaultKey) {
      setError(true);
      setDelay(5);
    } else {
      setError(false);
      onUnlocked();
    }
  };
  return (
    <main className="unlock-shell">
      <div className="grid-overlay" />
      <header><Brand /><span className="status-chip"><span /> Local vault</span></header>
      <section className="unlock-card">
        <div className="lock-emblem"><LockKeyhole size={29} /></div>
        <div className="title-block centered">
          <span className="eyebrow">Welcome back</span>
          <h1>Unlock your vault</h1>
          <p>Enter your Vault Key to access your protected credentials.</p>
        </div>
        <form className="form-stack" onSubmit={submit}>
          <PasswordField
            label="Vault Key"
            value={input}
            onChange={(value) => {
              setInput(value);
              setError(false);
            }}
            placeholder="Enter your Vault Key"
            error={error}
            autoFocus
          />
          {error && (
            <div className="error-message" role="alert">
              <X size={18} />
              <span>
                <strong>Incorrect Vault Key</strong>
                {delay ? `Try again in ${delay}s.` : "You can try again now."}
              </span>
            </div>
          )}
          <button className="primary-button" type="submit" disabled={!input || delay > 0}>
            <LockKeyhole size={18} /> Unlock vault
          </button>
        </form>
        <button className="text-button link-button" type="button" onClick={onForgot}>
          Forgot Vault Key?
        </button>
      </section>
      <p className="privacy-note"><ShieldCheck size={15} /> Your key never leaves this device</p>
    </main>
  );
}

function RecoveryVerify({ recovery, onVerified, onBack }: { recovery: RecoveryMethods; onVerified: () => void; onBack: () => void }) {
  const [method, setMethod] = useState<"key" | "questions" | null>(null);
  const [answer, setAnswer] = useState("");
  const [blocks, setBlocks] = useState(["", ""]);
  const keyMatches = blocks[0].trim().toUpperCase() === mockRecoveryKey[1] && blocks[1].trim().toUpperCase() === mockRecoveryKey[5];
  return (
    <main className="app-shell">
      <div className="page-card">
        <StepHeader
          step="Recovery · 1 of 3"
          title={method ? "Verify your recovery method" : "Choose a recovery method"}
          description={method ? "Complete the check to continue." : "Select a configured method to prove ownership of this vault."}
          onBack={onBack}
        />
        <div className="info-banner">
          <ShieldCheck size={19} />
          <p><strong>Recovery does not open your vault.</strong> It only lets you reset the Vault Key.</p>
        </div>
        {!method && <div className="recovery-choice-grid">
          <button className="recovery-choice" type="button" disabled={!recovery.recoveryKey} onClick={() => setMethod("key")}><span className="method-icon"><FileKey2 size={20} /></span><span><strong>Recovery Key</strong><small>{recovery.recoveryKey ? "Enter two requested blocks" : "Not configured"}</small></span><ArrowRight size={18} /></button>
          <button className="recovery-choice" type="button" disabled={!recovery.questions} onClick={() => setMethod("questions")}><span className="method-icon"><CircleHelp size={20} /></span><span><strong>Security Questions</strong><small>{recovery.questions ? "Answer your saved question" : "Not configured"}</small></span><ArrowRight size={18} /></button>
          {!recovery.recoveryKey && !recovery.questions && <div className="warning"><CircleHelp size={18} /><p>No recovery method was configured for this prototype vault.</p></div>}
        </div>}
        {method === "questions" && <div className="method-card active-method">
          <div className="method-heading static">
            <span className="method-icon"><CircleHelp size={20} /></span>
            <span><strong>Security question</strong><small>1 of 3 required</small></span>
            <span className="step-pill">Selected</span>
          </div>
          <div className="questions">
            <label className="field-label">
              <span>What was the name of your first school?</span>
              <input
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Type your answer"
                autoFocus
              />
            </label>
          </div>
        </div>}
        {method === "key" && <div className="method-card active-method"><div className="method-heading static"><span className="method-icon"><FileKey2 size={20} /></span><span><strong>Recovery Key</strong><small>Enter blocks 2 and 6</small></span><span className="step-pill">Selected</span></div><div className="questions confirm-blocks">{[2, 6].map((block, index) => <label className="field-label" key={block}><span>Block {block}</span><input value={blocks[index]} maxLength={5} onChange={(event) => { const next = [...blocks]; next[index] = event.target.value.toUpperCase(); setBlocks(next); }} placeholder="XXXXX" /></label>)}</div></div>}
        {method && <button className="primary-button" type="button" onClick={onVerified} disabled={method === "questions" ? !answer : !keyMatches}>
          Verify identity <ArrowRight size={19} />
        </button>}
        {method && <button className="method-switch" type="button" onClick={() => { setMethod(null); setAnswer(""); setBlocks(["", ""]); }}>Choose another method</button>}
      </div>
    </main>
  );
}

function Success({ onDone }: { onDone: () => void }) {
  return (
    <main className="app-shell">
      <div className="page-card success-card">
        <div className="success-emblem">
          <CheckCircle2 size={42} />
        </div>
        <span className="eyebrow">Recovery complete</span>
        <h1>Vault Key reset</h1>
        <p>Your new Vault Key is ready. Your vault stayed locked throughout recovery and is still protected.</p>
        <div className="info-banner">
          <ShieldCheck size={19} />
          <p>Recovery reset your key—it did not open or expose your vault.</p>
        </div>
        <button className="primary-button" type="button" onClick={onDone}>
          Continue to unlock <ArrowRight size={19} />
        </button>
      </div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("tutorial");
  const [vaultKey, setVaultKey] = useState("Krypteia demo key");
  const [recovery, setRecovery] = useState(mockRecoveryMethods);
  const page = useMemo(() => {
    if (screen === "tutorial") return <Tutorial onDone={() => setScreen("create")} />;
    if (screen === "tutorial-replay") return <Tutorial onDone={() => setScreen("manager")} />;
    if (screen === "create")
      return (
        <main className="app-shell">
          <div className="ambient ambient-one" />
          <div className="page-card">
            <StepHeader
              step="Step 1 of 2"
              title="Create your Vault Key"
              description="This is the only key that unlocks everything inside Krypteia."
              onBack={() => setScreen("tutorial")}
            />
            <KeyForm
              action="Create Vault Key"
              onSubmit={(key) => {
                setVaultKey(key);
                setScreen("recovery-setup");
              }}
            />
          </div>
        </main>
      );
    if (screen === "recovery-setup")
      return <SetupRecovery onDone={(methods) => { setRecovery(methods); setScreen("unlock"); }} onBack={() => setScreen("create")} />;
    if (screen === "unlock")
      return <Unlock vaultKey={vaultKey} onForgot={() => setScreen("recover-verify")} onUnlocked={() => setScreen("manager")} />;
    if (screen === "recover-verify")
      return <RecoveryVerify recovery={recovery} onVerified={() => setScreen("recover-reset")} onBack={() => setScreen("unlock")} />;
    if (screen === "recover-reset")
      return (
        <main className="app-shell">
          <div className="page-card">
            <StepHeader
              step="Recovery · 2 of 3"
              title="Set a new Vault Key"
              description="Choose a new key. Your vault remains locked until you use it."
              onBack={() => setScreen("recover-verify")}
            />
            <div className="info-banner compact-banner">
              <ShieldCheck size={19} />
              <p>This resets your key only—it does not open the vault.</p>
            </div>
            <KeyForm
              action="Reset Vault Key"
              onSubmit={(key) => {
                setVaultKey(key);
                setScreen("recover-success");
              }}
            />
          </div>
        </main>
      );
    if (screen === "recover-success") return <Success onDone={() => setScreen("unlock")} />;
    return (
      <DataManager
        vaultKey={vaultKey}
        recovery={recovery}
        onRecoveryChange={setRecovery}
        onLock={() => setScreen("unlock")}
        onReplayTutorial={() => setScreen("tutorial-replay")}
        onVaultKeyChange={setVaultKey}
      />
    );
  }, [screen, vaultKey, recovery]);
  return page;
}
