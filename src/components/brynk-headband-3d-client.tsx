"use client";

import dynamic from "next/dynamic";

// react-three-fiber's Canvas can't be server-rendered (no WebGL/DOM on the
// server), so load BrynkHeadband3D on the client only. This adds no extra DOM
// wrapper — dynamic() renders the component directly — so the component's own
// sticky/pinned <section> is unaffected.
const BrynkHeadband3D = dynamic(() => import("./BrynkHeadband3D"), {
  ssr: false,
});

export default function BrynkHeadband3DClient() {
  return <BrynkHeadband3D />;
}
