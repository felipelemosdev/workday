import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await base44.auth.resetPasswordRequest(email);
      if (result?.token) {
        setResetLink(`${window.location.origin}/reset-password?token=${result.token}`);
      }
    } catch {
      // Mostra sucesso de qualquer forma, para não revelar quais e-mails existem
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Redefinir senha"
      subtitle="Sistema local: sem envio de e-mail"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Voltar para o login
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-3 text-sm text-foreground text-center">
          {resetLink ? (
            <>
              <p>Como este é um sistema local, não há envio real de e-mail. Use o link abaixo para redefinir a senha:</p>
              <a href={resetLink} className="block break-all text-primary font-medium hover:underline">
                {resetLink}
              </a>
            </>
          ) : (
            <p>Se existir uma conta com esse e-mail, você poderá redefinir a senha.</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando link...
              </>
            ) : (
              "Gerar link de redefinição"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
