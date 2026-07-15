"use client";

import { useState } from "react";
import {
  Settings, Users, Key, Shield, CreditCard, FileText, Plus, Trash2,
  Copy, Eye, EyeOff, CheckCircle2, AlertCircle, DollarSign, Activity,
  Cpu, Mail, HardDrive, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ModuleId } from "./module-registry";

type Nav = { navigate: (id: ModuleId) => void };

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Suspended";
  joined: string;
};

const ROLES = [
  { name: "Super Admin", users: 2, permissions: "All access", color: "#E8501A" },
  { name: "Admin", users: 5, permissions: "Manage users, content, billing", color: "#6366F1" },
  { name: "User", users: 248, permissions: "Create & manage own content", color: "#0EA5E9" },
  { name: "Viewer", users: 87, permissions: "Read-only access", color: "#64748B" },
];

const INITIAL_USERS: User[] = [
  { id: "u1", name: "Sarah Khan", email: "sarah@example.com", role: "Super Admin", status: "Active", joined: "Jan 12, 2024" },
  { id: "u2", name: "Marcus Lee", email: "marcus@example.com", role: "Admin", status: "Active", joined: "Feb 3, 2024" },
  { id: "u3", name: "Lina Patel", email: "lina@example.com", role: "User", status: "Active", joined: "Mar 18, 2024" },
  { id: "u4", name: "James Rivera", email: "james@example.com", role: "User", status: "Active", joined: "Apr 7, 2024" },
  { id: "u5", name: "Nova Tan", email: "nova@example.com", role: "User", status: "Suspended", joined: "May 22, 2024" },
  { id: "u6", name: "Ethan Walsh", email: "ethan@example.com", role: "Viewer", status: "Active", joined: "Jun 9, 2024" },
];

const API_KEYS = [
  { id: "k1", name: "Production API", key: "sk-prod-••••••••••••••••••••4f2a", created: "Jan 4, 2024", lastUsed: "2 min ago" },
  { id: "k2", name: "Staging API", key: "sk-stg-••••••••••••••••••••8b9c", created: "Feb 12, 2024", lastUsed: "1 hour ago" },
  { id: "k3", name: "Mobile App", key: "sk-mob-••••••••••••••••••••2e7d", created: "Mar 3, 2024", lastUsed: "5 days ago" },
];

const AUDIT_LOG = [
  { action: "User role changed", actor: "Sarah Khan", target: "Marcus Lee → Admin", time: "12 min ago", severity: "warning" },
  { action: "API key generated", actor: "Sarah Khan", target: "Mobile App key", time: "1 hour ago", severity: "info" },
  { action: "User suspended", actor: "Marcus Lee", target: "Nova Tan", time: "3 hours ago", severity: "warning" },
  { action: "Payment settings updated", actor: "Sarah Khan", target: "Stripe gateway", time: "5 hours ago", severity: "info" },
  { action: "Failed login attempt", actor: "unknown", target: "admin@alolabs.com", time: "8 hours ago", severity: "critical" },
  { action: "Workflow deleted", actor: "James Rivera", target: "Old Welcome Flow", time: "1 day ago", severity: "info" },
];

const BILLING = [
  { label: "MRR", value: "$24,830", change: "+12%" },
  { label: "Active Subscriptions", value: "1,247", change: "+8%" },
  { label: "Pending Invoices", value: "18", change: "-3" },
  { label: "Refunds (30d)", value: "$840", change: "-22%" },
];

export default function Admin({ navigate }: Nav) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [keys, setKeys] = useState(API_KEYS);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const updateUserRole = (id: string, role: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" } : u)));
  };

  const deleteUser = (id: string) => setUsers((prev) => prev.filter((u) => u.id !== id));

  const addKey = () => {
    const id = `k${Date.now()}`;
    setKeys((prev) => [
      { id, name: `New Key ${prev.length + 1}`, key: `sk-new-••••••••••••••••••••${Math.random().toString(36).slice(2, 6)}`, created: "Just now", lastUsed: "Never" },
      ...prev,
    ]);
  };

  const deleteKey = (id: string) => setKeys((prev) => prev.filter((k) => k.id !== id));

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyKey = (id: string) => {
    const key = keys.find((k) => k.id === id);
    if (key) {
      navigator.clipboard?.writeText(key.key.replace(/•/g, "x"));
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#64748B]">
            <Settings className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Admin Dashboard</h1>
            <p className="text-white/60">Users, roles, API keys, billing, settings & audit logs</p>
          </div>
        </div>

        {/* Billing overview */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">Billing Overview</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {BILLING.map((b) => (
              <Card key={b.label} className="border-white/10 bg-white/5 text-white">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <DollarSign className="size-5 text-[#16A34A]" />
                    <Badge className="bg-[#16A34A]/20 text-[#86efac]">{b.change}</Badge>
                  </div>
                  <p className="mt-3 text-2xl font-bold">{b.value}</p>
                  <p className="text-xs text-white/50">{b.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* User Management */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Users className="size-5" style={{ color: "#6366F1" }} /> User Management</CardTitle>
                <CardDescription className="text-white/60">{users.length} users · {users.filter((u) => u.status === "Active").length} active</CardDescription>
              </div>
              <Button className="bg-[#6366F1] hover:bg-[#6366F1]/90"><Plus /> Invite User</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">User</TableHead>
                  <TableHead className="text-white/60">Role</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60">Joined</TableHead>
                  <TableHead className="text-right text-white/60">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-white/10">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#E8501A] text-xs font-bold">
                          {u.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-white/50">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => updateUserRole(u.id, v)}>
                        <SelectTrigger className="h-8 w-36 border-white/10 bg-white/5 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          u.status === "Active"
                            ? "bg-[#16A34A]/20 text-[#86efac]"
                            : "bg-[#EF4444]/20 text-[#fca5a5]"
                        }
                      >
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/60">{u.joined}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => toggleUserStatus(u.id)}>
                          {u.status === "Active" ? "Suspend" : "Activate"}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteUser(u.id)}>
                          <Trash2 className="size-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Roles */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="size-5" style={{ color: "#E8501A" }} /> Role Management</CardTitle>
              <CardDescription className="text-white/60">4 role tiers · {ROLES.reduce((a, r) => a + r.users, 0)} total users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {ROLES.map((r) => (
                <div key={r.name} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <div
                    className="flex size-10 items-center justify-center rounded-lg"
                    style={{ background: `${r.color}20`, color: r.color }}
                  >
                    <Shield className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-white/50">{r.permissions}</p>
                  </div>
                  <Badge variant="outline" className="border-white/20 text-white/70">{r.users} users</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Key className="size-5" style={{ color: "#0EA5E9" }} /> API Key Management</CardTitle>
                  <CardDescription className="text-white/60">{keys.length} keys · masked for security</CardDescription>
                </div>
                <Button size="sm" className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90" onClick={addKey}><Plus /> New Key</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {keys.map((k) => {
                const revealed = revealedKeys.has(k.id);
                return (
                  <div key={k.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{k.name}</p>
                        <p className="text-xs text-white/50">Created {k.created} · Last used {k.lastUsed}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => deleteKey(k.id)}>
                        <Trash2 className="size-4 text-red-400" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-[#0F172A] p-2">
                      <code className="flex-1 font-mono text-xs text-[#a5b4fc]">
                        {revealed ? k.key.replace(/•/g, "x") : k.key}
                      </code>
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => toggleReveal(k.id)}>
                        {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => copyKey(k.id)}>
                        {copied === k.id ? <CheckCircle2 className="size-3.5 text-[#16A34A]" /> : <Copy className="size-3.5" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* System Settings */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="size-5" style={{ color: "#6366F1" }} /> System Settings</CardTitle>
            <CardDescription className="text-white/60">Configure integrations & infrastructure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* AI Provider */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Cpu className="size-4 text-[#6366F1]" />
                  <h3 className="font-medium">AI Provider</h3>
                  <Badge className="ml-auto bg-[#16A34A]/20 text-[#86efac]">Connected</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Provider</span>
                    <span>OpenAI</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Model</span>
                    <span>GPT-4 Turbo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Fallback</span>
                    <span>Claude 3.5 Sonnet</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Rate limit</span>
                    <span>500 req/min</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full border-white/20 bg-transparent text-white hover:bg-white/10">
                  Configure
                </Button>
              </div>

              {/* Payment Gateway */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="size-4 text-[#E8501A]" />
                  <h3 className="font-medium">Payment Gateway</h3>
                  <Badge className="ml-auto bg-[#16A34A]/20 text-[#86efac]">Active</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Gateway</span>
                    <span>Stripe</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Mode</span>
                    <span>Live</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Currencies</span>
                    <span>USD, EUR, BDT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Webhook</span>
                    <span className="flex items-center gap-1 text-[#16A34A]"><CheckCircle2 className="size-3" /> OK</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full border-white/20 bg-transparent text-white hover:bg-white/10">
                  Configure
                </Button>
              </div>

              {/* SMTP */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Mail className="size-4 text-[#0EA5E9]" />
                  <h3 className="font-medium">SMTP / Email</h3>
                  <Badge className="ml-auto bg-[#16A34A]/20 text-[#86efac]">Active</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Provider</span>
                    <span>SendGrid</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">From</span>
                    <span>no-reply@alolabs.com</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Sent (30d)</span>
                    <span>48,290</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Bounce rate</span>
                    <span className="text-[#16A34A]">0.8%</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full border-white/20 bg-transparent text-white hover:bg-white/10">
                  Configure
                </Button>
              </div>

              {/* Storage */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <HardDrive className="size-4 text-[#16A34A]" />
                  <h3 className="font-medium">Storage</h3>
                  <Badge className="ml-auto bg-[#F59E0B]/20 text-[#fcd34d]">78% used</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Provider</span>
                    <span>AWS S3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Used</span>
                    <span>782 GB / 1 TB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Bucket</span>
                    <span>alolabs-prod</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Region</span>
                    <span>us-east-1</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full border-white/20 bg-transparent text-white hover:bg-white/10">
                  Configure
                </Button>
              </div>
            </div>

            {/* Feature toggles */}
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-medium"><Lock className="size-4" /> Feature Toggles</h3>
              <div className="space-y-3">
                {[
                  { name: "Allow public signups", on: true },
                  { name: "Require email verification", on: true },
                  { name: "Two-factor authentication", on: true },
                  { name: "Maintenance mode", on: false },
                ].map((t) => (
                  <div key={t.name} className="flex items-center justify-between">
                    <span className="text-sm text-white/80">{t.name}</span>
                    <Switch defaultChecked={t.on} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="size-5" style={{ color: "#E8501A" }} /> Audit Log</CardTitle>
            <CardDescription className="text-white/60">Last 6 system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {AUDIT_LOG.map((log, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <div
                    className={`flex size-8 items-center justify-center rounded-full ${
                      log.severity === "critical"
                        ? "bg-[#EF4444]/20 text-[#fca5a5]"
                        : log.severity === "warning"
                        ? "bg-[#F59E0B]/20 text-[#fcd34d]"
                        : "bg-[#0EA5E9]/20 text-[#7dd3fc]"
                    }`}
                  >
                    {log.severity === "info" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-white/50">
                      <span className="text-white/70">{log.actor}</span> → {log.target}
                    </p>
                  </div>
                  <span className="text-xs text-white/40">{log.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-[#64748B]/10 to-[#6366F1]/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">See the impact of your work</h3>
              <p className="text-sm text-white/60">View usage trends, engagement & content performance.</p>
            </div>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("analytics")}>
              <FileText /> View Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
