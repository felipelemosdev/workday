import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fmt, formatCurrency } from "@/lib/format";
import { PROCESS_STATUS } from "@/lib/constants";

export default function Processos() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const load = async () => {
    setLoading(true);
    try { setItems(await base44.entities.Process.list("-data_distribuicao", 500)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!term) return true;
      return [p.numero, p.cliente_nome, p.tipo_beneficio, p.responsavel].filter(Boolean).some((v) => v.toLowerCase().includes(term));
    });
  }, [items, q, status]);

  const totalValor = filtered.reduce((s, p) => s + (p.valor || 0), 0);

  return (
    <div>
      <PageHeader meta="Cartório & processos" title="Processos" subtitle={`${filtered.length} processo(s) · ${formatCurrency(totalValor)} em causa`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por número, cliente, benefício ou responsável…" className="pl-9 h-10 bg-card" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-border bg-card px-3 text-[13px]">
          <option value="all">Todos os status</option>
          {Object.entries(PROCESS_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.4fr_1.6fr_1fr_1.2fr_1fr_40px] gap-4 px-5 py-3 border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          <span>Número</span><span>Cliente</span><span>Órgão</span><span>Status</span><span>Valor</span><span />
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded bg-secondary/50 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-muted-foreground">Nenhum processo encontrado.</div>
        ) : (
          filtered.map((p) => (
            <button key={p.id} onClick={() => p.cliente_id && navigate(`/clientes/${p.cliente_id}`)} className="w-full grid grid-cols-1 md:grid-cols-[1.4fr_1.6fr_1fr_1.2fr_1fr_40px] gap-4 px-5 py-4 border-b border-border last:border-0 text-left hover:bg-secondary/40 transition-colors items-center group">
              <span className="text-[13px] font-medium tabular-nums truncate">{p.numero}</span>
              <span className="text-[13px] text-foreground truncate">{p.cliente_nome || "—"}</span>
              <span className="hidden md:block text-[13px] text-muted-foreground">{p.orgao}</span>
              <span className="hidden md:block text-[12px] font-medium text-foreground">{PROCESS_STATUS[p.status] || p.status}</span>
              <span className="hidden md:block text-[13px] text-muted-foreground tabular-nums">{p.valor ? formatCurrency(p.valor) : "—"}</span>
              <ChevronRight className="hidden md:block w-4 h-4 text-muted-foreground group-hover:text-foreground justify-self-end" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}