import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DumpLink | ダンプ・現場マッチング",
  description: "ダンプ・現場マッチングアプリ MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
