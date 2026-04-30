import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface LegalLayoutProps {
  title: string;
  updatedAt?: string;
  children: ReactNode;
}

export const LegalLayout = ({ title, updatedAt = "Octubre 2025", children }: LegalLayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container max-w-3xl py-12 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <header className="border-b border-border/60 pb-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">{title}</h1>
          <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
            Última actualización: {updatedAt} · Aplicable en Colombia 🇨🇴
          </p>
        </header>

        <article className="prose-legal space-y-6 text-[15px] leading-relaxed text-foreground/85">
          {children}
        </article>

        <p className="mt-12 text-xs text-muted-foreground border-t border-border/60 pt-6">
          ¿Dudas legales? Escríbenos a{" "}
          <a href="mailto:legal@deseo-x.com" className="text-accent hover:underline">
            legal@deseo-x.com
          </a>
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default LegalLayout;
