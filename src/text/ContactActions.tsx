"use client";

import { useState } from "react";
import { profile } from "@/data/resume";

/**
 * The address is assembled on click, so the served markup carries no
 * plain-text mailto: for scrapers to pick up. Carried over from the previous
 * CV unchanged — it is the one piece of behaviour the redesign must not lose.
 */
export function EmailLink({ className }: { className?: string }) {
  const [revealed, setRevealed] = useState(false);
  const address = `${profile.email.user}@${profile.email.domain}`;

  if (revealed) {
    return (
      <a className={className} href={`mailto:${address}`}>
        {address}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        setRevealed(true);
        window.location.href = `mailto:${address}`;
      }}
    >
      {profile.email.user} [at] {profile.email.domain}
    </button>
  );
}

export function PrintButton() {
  return (
    <button type="button" className="doc__action" onClick={() => window.print()}>
      Download PDF
    </button>
  );
}
