import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const montserrat = localFont({
  src: [
    { path: "./fonts/Montserrat-Regular.ttf", weight: "400" },
    { path: "./fonts/Montserrat-SemiBold.ttf", weight: "600" },
    { path: "./fonts/Montserrat-Bold.ttf", weight: "700" },
    { path: "./fonts/Montserrat-ExtraBold.ttf", weight: "800" },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qual é o seu nível de IA? | High Media",
  description: "3 minutos. Serve para a High planejar treinamentos e ferramentas para o time.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#161616", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={montserrat.variable}>
      <body className="font-sans antialiased">
        <div className="chevrons" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
