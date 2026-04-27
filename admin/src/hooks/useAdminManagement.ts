import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface AuthorizedAdmin {
  email: string;
  access_level: "full_access" | "view_only";
  created_at?: string;
}

export const useAdminManagement = () => {
  const [authorizedList, setAuthorizedList] = useState<AuthorizedAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // 1. Get current logged in user identity
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setCurrentUserEmail(data.user?.email || ""));
  }, []);

  // 2. Fetch all authorized admins
  const fetchAdmins = useCallback(async () => {
    const { data, error } = await supabase
      .from("authorized_admins")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setAuthorizedList(data || []);
  }, []);

  // 3. Real-time Subscription
  useEffect(() => {
    fetchAdmins();

    const channel = supabase
      .channel("admin-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "authorized_admins" },
        () => fetchAdmins(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAdmins]);

  // 4. Actions: Authorize
  const authorizeAdmin = async (email: string, access_level: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("authorized_admins")
      .insert([{ email, access_level }]);
    setLoading(false);
    return { error };
  };

  // 5. Actions: Update
  const updateAdminLevel = async (targetEmail: string, newLevel: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("authorized_admins")
      .update({ access_level: newLevel })
      .eq("email", targetEmail);
    setLoading(false);
    return { error };
  };

  // 6. Actions: Revoke
  const revokeAdmin = async (targetEmail: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("authorized_admins")
      .delete()
      .eq("email", targetEmail);
    setLoading(false);
    return { error };
  };

  return {
    authorizedList,
    currentUserEmail,
    loading,
    authorizeAdmin,
    updateAdminLevel,
    revokeAdmin,
    refresh: fetchAdmins,
  };
};
