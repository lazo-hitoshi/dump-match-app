"use client";

import { useActionState } from "react";
import { signInWithEmail } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInWithEmail, { error: null });

  return (
    <>
      <p className="eyebrow">DumpLink</p>
      <h1 style={{ marginTop: 8, marginBottom: 24 }}>ログイン</h1>
      <section className="panel" style={{ padding: 20 }}>
        <form action={formAction} className="entry-form" style={{ paddingTop: 0 }}>
          <label>
            メールアドレス
            <input
              type="email"
              name="email"
              autoComplete="email"
              defaultValue="watanabe@hitoshi.cloud"
              required
            />
          </label>
          <label>
            パスワード
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          {state.error ? (
            <p style={{ color: "var(--red)", margin: 0, fontSize: "0.875rem" }}>{state.error}</p>
          ) : null}
          <button type="submit" className="primary-action full-width" disabled={pending}>
            {pending ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </section>
      <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: 16 }}>
        Supabase Auth にユーザーを作成し、`public.users.id` を Auth UID と一致させてください。
      </p>
    </>
  );
}
