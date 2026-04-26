import { Toaster } from "sonner";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ClientProviders from "@/components/ClientProviders";

export const metadata = {
  title: "Hero Chess | The Premium Arena",
  description: "Experience high-fidelity chess with real-time multiplayer, AI opponents, and social features.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        <ClientProviders>
          <main className="pt-20">
            {children}
          </main>
        </ClientProviders>
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
