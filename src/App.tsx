import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AgeGate } from "@/components/AgeGate";
import { I18nProvider } from "@/lib/i18n";
import Index from "./pages/Index.tsx";
import Profile from "./pages/Profile.tsx";
import Registro from "./pages/Registro.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import VerifyOtp from "./pages/VerifyOtp.tsx";
import Verificacion from "./pages/Verificacion.tsx";
import Cuenta from "./pages/Cuenta.tsx";
import Planes from "./pages/Planes.tsx";
import Admin from "./pages/Admin.tsx";
import Terminos from "./pages/legal/Terminos.tsx";
import Privacidad from "./pages/legal/Privacidad.tsx";
import CookiesPage from "./pages/legal/Cookies.tsx";
import Disclaimer from "./pages/legal/Disclaimer.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner theme="dark" richColors position="top-center" />
        <BrowserRouter>
          <AgeGate />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explorar" element={<Index />} />
            <Route path="/perfil/:id" element={<Profile />} />
            {/* Gateway visitante/creador */}
            <Route path="/registro" element={<Registro />} />
            {/* Dashboard del creador (antes /registro era el formulario) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/editar-perfil" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verificar" element={<VerifyOtp />} />
            <Route path="/verificacion" element={<Verificacion />} />
            <Route path="/cuenta" element={<Cuenta />} />
            <Route path="/planes" element={<Planes />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/legal/terminos" element={<Terminos />} />
            <Route path="/legal/privacidad" element={<Privacidad />} />
            <Route path="/privacidad" element={<Privacidad />} />
            <Route path="/legal/cookies" element={<CookiesPage />} />
            <Route path="/legal/disclaimer" element={<Disclaimer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
