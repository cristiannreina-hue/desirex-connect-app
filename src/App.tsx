import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AgeGate } from "@/components/AgeGate";
import Index from "./pages/Index.tsx";
import Profile from "./pages/Profile.tsx";
import Register from "./pages/Register.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Verificacion from "./pages/Verificacion.tsx";
import Cuenta from "./pages/Cuenta.tsx";
import Mensajes from "./pages/Mensajes.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" richColors position="top-center" />
      <BrowserRouter>
        <AgeGate />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/explorar" element={<Index />} />
          <Route path="/perfil/:id" element={<Profile />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verificacion" element={<Verificacion />} />
          <Route path="/cuenta" element={<Cuenta />} />
          <Route path="/mensajes" element={<Mensajes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
