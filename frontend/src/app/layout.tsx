import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Smart DevTool — AI-Powered API Integration",
  description:
    "Stop reading API docs manually. Let our multi-agent AI crawl, analyze, and generate production-ready SDK wrappers for any API in seconds.",
  keywords: ["API integration", "SDK generator", "AI developer tools", "FastAPI", "LangChain"],
  openGraph: {
    title: "Smart DevTool — AI-Powered API Integration",
    description: "Generate production-ready API wrappers with AI in seconds.",
    type: "website",
  },
};
import { AuthProvider } from "@/lib/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <div className="mesh-bg" />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
