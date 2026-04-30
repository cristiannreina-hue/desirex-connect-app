import { LegalLayout } from "./LegalLayout";

const Terminos = () => (
  <LegalLayout title="Términos y Condiciones de Uso">
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">1. Aceptación y mayoría de edad</h2>
      <p>
        DeseoX Connect ("la Plataforma") es un servicio digital exclusivo para personas <strong>mayores de 18 años</strong>.
        Al registrarte, declaras bajo gravedad de juramento que cumples con la mayoría de edad legal en Colombia y que
        aceptas íntegramente estos Términos. El acceso por menores está estrictamente prohibido y constituye causal
        inmediata de expulsión y reporte a las autoridades competentes.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">2. Naturaleza del servicio</h2>
      <p>
        DeseoX es una plataforma tecnológica de <strong>conexión social entre adultos</strong>. No prestamos, ofrecemos
        ni intermediamos servicios personales de ningún tipo. Únicamente facilitamos el contacto digital entre usuarios
        registrados bajo los roles de "Creador" y "Visitante".
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">3. Responsabilidades del Creador</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Garantizar que <strong>todas las fotografías y contenidos publicados son propios, recientes y veraces</strong>.</li>
        <li>Responder por la autenticidad de los datos personales, ubicación y documentación entregada.</li>
        <li>No publicar contenido que involucre menores, violencia, explotación o actividades ilícitas.</li>
        <li>Mantener un trato respetuoso con los Visitantes y con el equipo de moderación.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">4. Responsabilidades del Visitante</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Usar la Plataforma con fines lícitos y respetuosos.</li>
        <li>No realizar capturas de pantalla, descargas no autorizadas ni redistribución del contenido de los Creadores.</li>
        <li>Abstenerse de cualquier solicitud que vulnere la dignidad o la ley colombiana.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">5. Reserva del derecho de admisión y expulsión</h2>
      <p>
        DeseoX se reserva el <strong>derecho de admisión, suspensión y expulsión</strong> de cualquier cuenta —sin
        previo aviso ni reembolso— en casos de: comportamiento abusivo, fraude, suplantación, uso de fotografías
        falsas o de terceros, intento de evadir la verificación KYC, o cualquier conducta que atente contra la
        seguridad e integridad de la comunidad.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">6. Modificaciones</h2>
      <p>
        Estos Términos pueden actualizarse en cualquier momento. Notificaremos cambios materiales mediante la
        Plataforma. El uso continuado tras la actualización implica aceptación.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">7. Ley aplicable y jurisdicción</h2>
      <p>
        Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia se someterá a los
        jueces competentes de la ciudad de Bogotá D.C.
      </p>
    </section>
  </LegalLayout>
);

export default Terminos;
