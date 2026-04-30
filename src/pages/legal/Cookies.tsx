import { LegalLayout } from "./LegalLayout";

const Cookies = () => (
  <LegalLayout title="Política de Cookies">
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">1. ¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web.
        Permiten reconocerte, mantener tu sesión activa y mejorar tu experiencia.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">2. Cookies que utilizamos</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Cookies técnicas (esenciales):</strong> indispensables para el funcionamiento de la plataforma.
          Mantienen tu sesión iniciada, recuerdan que verificaste tu mayoría de edad (Age Gate) y conservan
          preferencias básicas como el idioma.
        </li>
        <li>
          <strong>Cookies de seguridad:</strong> ayudan a detectar intentos de fraude, accesos no autorizados y
          ataques automatizados. Son críticas para proteger tu cuenta.
        </li>
        <li>
          <strong>Cookies de rendimiento (anónimas):</strong> nos permiten medir el uso agregado del sitio sin
          identificarte personalmente.
        </li>
      </ul>
      <p className="mt-3">
        <strong>No utilizamos cookies publicitarias de terceros</strong> ni vendemos tu información a anunciantes.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">3. Gestión de cookies</h2>
      <p>
        Puedes configurar tu navegador para bloquear o eliminar cookies. Sin embargo, deshabilitar las cookies
        técnicas impedirá el correcto funcionamiento de DeseoX (no podrás iniciar sesión).
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">4. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política para reflejar cambios técnicos o legales. Publicaremos la versión vigente
        en esta misma página.
      </p>
    </section>
  </LegalLayout>
);

export default Cookies;
