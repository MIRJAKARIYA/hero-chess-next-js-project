import { Toaster } from "sonner";
import "./globals.css";

export const metadata = {
  title: "Hero Chess | The Premium Arena",
  description: "Experience high-fidelity chess with real-time multiplayer, AI opponents, and social features.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
