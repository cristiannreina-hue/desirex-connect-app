import { LegalLayout } from "./LegalLayout";

const Terminos = () => (
  <LegalLayout title="Términos y Condiciones de Uso" updatedAt="Abril 2026">
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">1. Aceptación y Mayoría de Edad</h2>
      <p>
        DeseoX Connect ("la Plataforma") es un servicio exclusivo para personas <strong>mayores de 18 años</strong>.
        Al registrarte, declaras bajo gravedad de juramento que cumples con la mayoría de edad legal en Colombia.
        El acceso por menores está estrictamente prohibido y constituye causal de expulsión inmediata y reporte a las autoridades.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">2. Naturaleza del Servicio</h2>
      <p>
        DeseoX es una plataforma tecnológica de <strong>conexión social entre adultos</strong>. No prestamos, ofrecemos
        ni intermediamos servicios personales. Únicamente facilitamos el contacto digital entre usuarios bajo los roles
        de <strong>"Creador"</strong> y <strong>"Visitante"</strong>.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">3. Responsabilidades del Creador</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Garantizar que las fotografías y contenidos son <strong>propios, recientes y veraces</strong>.</li>
        <li>Responder por la autenticidad de los datos entregados en el proceso de verificación.</li>
        <li>No publicar contenido ilícito o que vulnere la dignidad humana.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">4. Responsabilidades del Visitante</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Usar la plataforma de forma respetuosa y lícita.</li>
        <li>
          <strong>Prohibición total</strong> de realizar capturas de pantalla, descargas o redistribución de contenido ajeno.
        </li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">5. Protección de Datos y Propiedad Intelectual</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Los datos de verificación se manejan bajo protocolos de <strong>cifrado de extremo a extremo</strong> para garantizar
          la privacidad del usuario.
        </li>
        <li>
          El nombre <strong>"DeseoX"</strong>, su logo y código fuente son propiedad exclusiva de DeseoX Connect.
          Se prohíbe su reproducción total o parcial.
        </li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">6. Reserva del Derecho de Admisión</h2>
      <p>
        La administración de DeseoX se reserva el derecho de <strong>suspender o eliminar cuentas</strong> por fraude,
        suplantación de identidad o incumplimiento de estas normas, sin previo aviso.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">7. Ley Aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la <strong>República de Colombia</strong> y cualquier controversia se
        someterá a los jueces de la ciudad de Bogotá D.C.
      </p>
    </section>
  </LegalLayout>
);

export default Terminos;
