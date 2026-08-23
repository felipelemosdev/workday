import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { UserPlus, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";

function randomPassword() {
  return Math.random().toString(36).slice(-10);
}

export default function InviteUsers() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(randomPassword());
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success' | 'error', msg }

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      setResult({ type: "error", msg: "A senha precisa ter pelo menos 6 caracteres." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      await base44.users.createUser({ email: email.trim(), password, role });
      setResult({
        type: "success",
        msg: `Usuário ${email.trim()} criado. Repasse o login e a senha definidos acima para essa pessoa acessar o sistema.`,
      });
      setEmail("");
      setPassword(randomPassword());
    } catch (err) {
      setResult({ type: "error", msg: err?.message || "Não foi possível criar o usuário." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2.5 mb-2">
        <ShieldCheck className="w-4 h-4 text-muted-foreground" strokeWidth={1.6} />
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-foreground">Usuários · Acesso ao sistema</h3>
      </div>
      <p className="text-[12px] text-muted-foreground mb-5">
        Como administrador, você define o login e a senha de cada novo usuário diretamente aqui (sistema local, sem envio de e-mail).
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">E-mail (login)</Label>
            <Input id="invite-email" type="email" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Função</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invite-password">Senha</Label>
          <div className="relative">
            <Input
              id="invite-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">Gerada automaticamente — edite se quiser definir uma senha específica.</p>
        </div>

        <Button type="submit" disabled={loading || !email || !password} className="h-9 bg-accent hover:bg-accent/90 text-accent-foreground">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : <><UserPlus className="w-4 h-4" /> Criar usuário</>}
        </Button>

        {result && (
          <div className={`flex items-start gap-2 text-[12px] rounded-md px-3 py-2.5 border ${result.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"}`}>
            {result.type === "success" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            <span>{result.msg}</span>
          </div>
        )}
      </form>
    </div>
  );
}
