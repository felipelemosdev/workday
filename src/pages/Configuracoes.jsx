import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import InviteUsers from "@/components/InviteUsers";
import { useAuth } from "@/lib/AuthContext";
import { TEAM } from "@/lib/constants";
import { Building2, Users, SlidersHorizontal, FileClock, ChevronRight } from "lucide-react";

export default function Configuracoes() {
  const { user } = useAuth();
  const [firm, setFirm] = useState({ nome: "Praxis Advocacia", cnpj: "00.000.000/0001-00", email: "contato@praxis.adv.br", telefone: "(11) 3000-0000", endereco: "Av. Paulista, 1000 — São Paulo/SP" });
  const set = (k, v) => setFirm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader meta="Administração" title="Configurações" subtitle="Dados do escritório, equipe e preferências do sistema." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firm */}
        <Section icon={Building2} title="Dados do escritório">
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="fn">Nome do escritório</Label><Input id="fn" value={firm.nome} onChange={(e) => set("nome", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label htmlFor="cnpj">CNPJ</Label><Input id="cnpj" value={firm.cnpj} onChange={(e) => set("cnpj", e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="ftel">Telefone</Label><Input id="ftel" value={firm.telefone} onChange={(e) => set("telefone", e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="fmail">E-mail de contato</Label><Input id="fmail" value={firm.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="fend">Endereço</Label><Input id="fend" value={firm.endereco} onChange={(e) => set("endereco", e.target.value)} /></div>
            <Button className="mt-2 h-9 bg-accent hover:bg-accent/90 text-accent-foreground">Salvar alterações</Button>
          </div>
        </Section>

        <div className="space-y-6">
          {/* Team */}
          <Section icon={Users} title="Equipe">
            <div className="divide-y divide-border">
              {TEAM.map((t, i) => (
                <div key={t} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-[11px] font-semibold">{t.split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
                    <div>
                      <p className="text-[13px] font-medium">{t}</p>
                      <p className="text-[11px] text-muted-foreground">{i < 2 ? "Advogado(a) responsável" : "Estagiário(a)"}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2.5 py-1 rounded-full border ${i < 2 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>{i < 2 ? "Ativo" : "Ativo"}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Invites */}
          <InviteUsers />

          {/* System report link - admin only */}
          {user?.role === "admin" && (
            <Link
              to="/auditoria"
              className="flex items-center justify-between bg-card border border-border rounded-lg p-6 hover:border-foreground/25 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileClock className="w-4 h-4 text-muted-foreground" strokeWidth={1.6} />
                <div>
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-foreground">Relatório de sistema</h3>
                  <p className="text-[12px] text-muted-foreground mt-1">Veja o que cada pessoa criou, editou ou apagou.</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}

          {/* Preferences */}
          <Section icon={SlidersHorizontal} title="Preferências">
            <div className="space-y-3">
              {[
                ["Notificações por e-mail", true],
                ["Lembretes automáticos de perícia", true],
                ["Ocultar CPF em listagens", true],
                ["Tema compacto", false],
              ].map(([label, on]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-[13px] text-foreground">{label}</span>
                  <Toggle defaultOn={on} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.6} />
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({ defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => setOn((v) => !v)} className={`w-10 h-6 rounded-full transition-colors relative ${on ? "bg-accent" : "bg-secondary border border-border"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card border border-border shadow-sm transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}