"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import CajaPortal from "@/components/dashboard/CajaPortal";

export default function RecibosPage() {
  const [cajeroNombre, setCajeroNombre] = useState("Caja");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("perfiles_usuarios")
          .select("nombre")
          .eq("id", user.id)
          .maybeSingle();
        setCajeroNombre(prof?.nombre || user.email?.split("@")[0] || "Caja");
      }
    }
    loadUser();
  }, []);

  return <CajaPortal cajeroNombre={cajeroNombre} />;
}
