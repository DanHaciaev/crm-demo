"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import client from "@/app/api/client";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target[0]?.value;
    const password = e.target[1]?.value;

    if (!email || !password) {
      toast.error("Введите email и пароль");
      return;
    }

    setLoading(true);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    console.log("error:", JSON.stringify(error));
    console.log("data:", JSON.stringify(data));
    setLoading(false);

    if (error) {
      toast.error("Неверный email или пароль");
      return;
    }

    toast.success("Добро пожаловать!");
    router.push("/dashboard"); // замени на свой роут
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Вход</CardTitle>
        <CardDescription>Введите email и пароль для входа</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-6 mt-2">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" placeholder="mail@mail.com" required />
            </div>
            <div className="grid gap-2">
              <Label>Пароль</Label>
              <Input type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Вход..." : "Войти"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Login;
