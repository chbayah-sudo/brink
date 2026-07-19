"use client";

import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/reveal";

/**
 * PRE-ORDER — email capture (SEC-03, slots where the old device section was).
 * Centered statement layout: serif headline + wide bracketed terminal input.
 *
 * Backend: Web3Forms (static-export friendly — no server). Every submission is
 * emailed to the inbox tied to the access key, and their dashboard keeps the
 * list with CSV export. Set NEXT_PUBLIC_WEB3FORMS_KEY in .env.local and in the
 * Vercel project env; the key is public by design (rate-limited server-side).
 */

const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "";
const ACCENT = "#ff5b3a";
const EMAIL_RE = /^\S+@\S+\.\S+$/;

type Status = "idle" | "sending" | "success" | "error";

function useSignup() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const submit = async (email: string, honeypot: string) => {
    if (status === "sending" || status === "success") return;
    if (honeypot) {
      // bot filled the hidden field — swallow silently
      setStatus("success");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setStatus("error");
      setError("ENTER A VALID EMAIL");
      return;
    }
    if (!WEB3FORMS_KEY) {
      setStatus("error");
      setError("SETUP REQUIRED — ADD NEXT_PUBLIC_WEB3FORMS_KEY");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          email,
          subject: "New Brink pre-order signup",
          from_name: "brink-site",
        }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setError((data.message || "TRANSMISSION FAILED — RETRY").toUpperCase());
      }
    } catch {
      setStatus("error");
      setError("NETWORK ERROR — RETRY");
    }
  };

  return { status, error, submit };
}

function Bracket({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-5 w-5 border-[#ff5b3a]/45 ${className}`}
    />
  );
}

export function Preorder() {
  const { status, error, submit } = useSignup();
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");

  return (
    <section
      id="preorder"
      className="relative py-24 md:py-36"
      // soft ink seat so the copy doesn't fight the dither haze behind it
      style={{
        background:
          "linear-gradient(180deg, rgba(10,12,16,0) 0%, rgba(10,12,16,0.6) 16%, rgba(10,12,16,0.6) 84%, rgba(10,12,16,0) 100%)",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <SectionHeader number="03" title="PRE-ORDER" sec="SEC-03" />

        <Reveal className="mt-14 text-center md:mt-20">
          <p className="mx-auto max-w-3xl font-serif-df text-3xl leading-[1.12] text-df-white md:text-5xl lg:text-6xl">
            Be first past the brink.
          </p>
          <p className="mx-auto mt-6 max-w-xl font-mono-df text-sm leading-[1.6] text-df-white/75 md:text-[15px]">
            The first production run is limited. The list hears before anyone
            else.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-10 md:mt-14">
          {status === "success" ? (
            <div className="mx-auto max-w-xl text-center">
              <p className="font-mono-df text-sm tracking-[0.18em] text-df-white">
                <span
                  className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full align-middle"
                  style={{ background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }}
                />
                SIGNAL RECEIVED
              </p>
              <p className="mt-3 font-mono-df text-xs tracking-[0.14em] text-df-white/65">
                YOU&apos;RE ON THE LIST — ONE EMAIL WHEN PRE-ORDERS OPEN.
              </p>
            </div>
          ) : (
            <form
              className="mx-auto max-w-xl"
              onSubmit={(e) => {
                e.preventDefault();
                submit(email, hp);
              }}
            >
              <div className="relative flex">
                <Bracket className="-left-px -top-px border-l border-t" />
                <Bracket className="-right-px -top-px border-r border-t" />
                <Bracket className="-bottom-px -left-px border-b border-l" />
                <Bracket className="-bottom-px -right-px border-b border-r" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  aria-label="Email address"
                  className="min-w-0 flex-1 border border-df-white/25 bg-transparent px-4 py-3.5 font-mono-df text-sm text-df-white outline-none transition-colors placeholder:text-df-white/45 focus:border-[#ff5b3a]/70"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="shrink-0 border border-[#ff5b3a] bg-[#ff5b3a] px-5 font-mono-df text-xs uppercase tracking-[0.2em] text-[#0a0c10] transition-colors hover:bg-transparent hover:text-[#ff5b3a] disabled:opacity-60 md:px-7"
                >
                  {status === "sending" ? "SENDING…" : "RESERVE"}
                </button>
                {/* honeypot — humans never see or fill this */}
                <input
                  type="text"
                  name="botcheck"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="absolute h-0 w-0 opacity-0"
                />
              </div>
              <p className="mt-3 text-center font-mono-df text-[0.65rem] tracking-[0.24em] text-df-gray">
                {status === "error" ? (
                  <span style={{ color: ACCENT }}>{error}</span>
                ) : (
                  "NO SPAM · ONE EMAIL WHEN DOORS OPEN"
                )}
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
