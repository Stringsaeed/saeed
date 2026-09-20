"use client";

import dynamic from "next/dynamic";

const Studio = dynamic(() => import("./studio"), {
  ssr: false,
});

export default function StudioLoader() {
  return <Studio />;
}
