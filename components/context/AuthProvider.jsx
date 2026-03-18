"use client";

import { createContext, useState, useEffect } from "react";
import client from "@/app/api/client";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId) {
    const { data } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
  }

  useEffect(() => {
    client.auth.getSession().then(({ data }) => {
      const u = data?.session?.user || null;
      setUser(u);
      if (u) fetchProfile(u.id);
      setLoading(false);
    });

    const { data: listener } = client.auth.onAuthStateChange((e, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) fetchProfile(u.id);
      else { setProfile(null); }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };