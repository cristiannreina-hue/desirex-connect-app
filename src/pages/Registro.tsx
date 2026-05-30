import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";

const Registro = () => {
  const [params] = useSearchParams();
  const redirectParam = params.get("redirect");
  const safeRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : null;

  useEffect(() => {
    try { sessionStorage.setItem("deseox.intent", "creator"); } catch {}
  }, []);

  const target = safeRedirect
    ? `/registro/creadora?redirect=${encodeURIComponent(safeRedirect)}`
    : "/registro/creadora";

  return <Navigate to={target} replace />;
};

export default Registro;
