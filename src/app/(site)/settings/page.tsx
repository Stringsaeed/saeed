import type { Metadata } from "next";
import { AppWindow } from "@/components/os/app-window";
import { findBuiltInApp } from "@/data/apps";
import { SettingsPanel } from "./settings-panel";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires metadata to be exported from a page.
export const metadata: Metadata = {
  title: "Settings",
  description: "Choose the platform, appearance, and sounds for this site.",
  robots: {
    index: false,
  },
};

export default function SettingsPage() {
  const app = findBuiltInApp("settings");
  return (
    <AppWindow app={app} title="Settings">
      <SettingsPanel />
    </AppWindow>
  );
}
