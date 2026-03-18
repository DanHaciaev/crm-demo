import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const { email, password, first_name, last_name, role } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 });
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await adminClient
    .from("profiles")
    .update({ first_name, last_name, role: role ?? "user" })
    .eq("id", data.user.id);

  return NextResponse.json({ success: true });
}