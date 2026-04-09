"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Copy,
  Check,
  Loader2,
  Plus,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Invite {
  id: string;
  code: string;
  isUsed: boolean;
  expiresAt: string | null;
  createdAt: string;
}

type InviteStatus = "disponivel" | "usado" | "expirado";

function getStatus(invite: Invite): InviteStatus {
  if (invite.isUsed) return "usado";
  if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) return "expirado";
  return "disponivel";
}

const STATUS_CONFIG: Record<
  InviteStatus,
  { label: string; className: string }
> = {
  disponivel: {
    label: "Disponível",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  usado: {
    label: "Usado",
    className: "bg-muted text-muted-foreground border-border",
  },
  expirado: {
    label: "Expirado",
    className: "bg-red-50 text-red-600 border-red-200",
  },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ConvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchInvites() {
    setLoading(true);
    const res = await fetch("/api/invites");
    if (res.ok) setInvites(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchInvites();
  }, []);

  async function createInvite() {
    setCreating(true);
    setError(null);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInDays: 7 }),
    });
    if (res.ok) {
      const invite = await res.json();
      setInvites((prev) => [invite, ...prev]);
    } else {
      setError("Não foi possível gerar o convite. Tente novamente.");
    }
    setCreating(false);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Não foi possível copiar o código.");
    }
  }

  const available = invites.filter((i) => getStatus(i) === "disponivel").length;
  const used = invites.filter((i) => getStatus(i) === "usado").length;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-primary" />
            Convites
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Gere códigos para convidar novos usuários para a plataforma.
          </p>
        </div>
        <Button onClick={createInvite} disabled={creating} className="shrink-0 sm:self-start">
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Gerar convite
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs underline underline-offset-2 opacity-70 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Stats rápidas */}
      {invites.length > 0 && (
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">{available}</strong> disponíveis
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">{used}</strong> usados
            </span>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Carregando convites…</p>
        </div>
      ) : invites.length === 0 ? (
        /* Estado vazio */
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl border border-dashed">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Ticket className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-medium text-sm">Nenhum convite gerado ainda</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Gere um código de convite e compartilhe com quem você quer convidar para a plataforma.
            </p>
          </div>
          <Button onClick={createInvite} disabled={creating} size="sm">
            {creating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Gerar primeiro convite
          </Button>
        </div>
      ) : (
        /* Tabela de convites */
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Código
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">
                  Criado em
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">
                  Expira em
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {invites.map((invite, i) => {
                const status = getStatus(invite);
                const config = STATUS_CONFIG[status];
                const isCopied = copied === invite.code;

                return (
                  <tr
                    key={invite.id}
                    className={cn(
                      "border-b last:border-0 transition-colors",
                      status === "disponivel"
                        ? "hover:bg-muted/30"
                        : "opacity-60"
                    )}
                  >
                    {/* Código */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-semibold tracking-widest text-[13px]">
                        {invite.code}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <Badge
                        variant="outline"
                        className={cn("text-[11px] font-medium", config.className)}
                      >
                        {config.label}
                      </Badge>
                    </td>

                    {/* Criado em */}
                    <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">
                      {fmt(invite.createdAt)}
                    </td>

                    {/* Expira em */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {invite.expiresAt ? (
                        <span
                          className={cn(
                            "flex items-center gap-1 text-muted-foreground",
                            status === "expirado" && "text-red-500"
                          )}
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                          {fmt(invite.expiresAt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Ação */}
                    <td className="px-4 py-3.5 text-right">
                      {status === "disponivel" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCode(invite.code)}
                          className={cn(
                            "h-8 gap-1.5 text-xs transition-all",
                            isCopied &&
                              "border-emerald-300 bg-emerald-50 text-emerald-700"
                          )}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copiar
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 px-2">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Nota */}
      <p className="text-xs text-muted-foreground">
        Convites gerados expiram em 7 dias por padrão. Cada código só pode ser
        usado uma vez.
      </p>
    </div>
  );
}
