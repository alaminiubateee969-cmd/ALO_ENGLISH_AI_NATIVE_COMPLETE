import type { Metadata } from "next";
import { SoftwareFactoryControlCenter } from "@/components/factory/control-center";

export const metadata: Metadata = {
  title: "BDTECH360 Software Factory Control Center",
  description: "Private company registry, reusable application templates, controlled provisioning, releases and recovery.",
  robots: { index: false, follow: false },
};

export default function FactoryPage() {
  return <SoftwareFactoryControlCenter />;
}
