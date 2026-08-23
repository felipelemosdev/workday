import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";

export default function ResponsavelField({ value, onChange, id = "responsavel", label = "Responsável", className = "" }) {
  const { user } = useAuth();
  const currentUserName = user?.full_name || user?.email || "";

  useEffect(() => {
    if (!value && currentUserName) onChange(currentUserName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserName]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={currentUserName || "Nome do responsável"}
      />
    </div>
  );
}