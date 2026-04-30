import { LegalLayout } from "./LegalLayout";

const Privacidad = () => (
  <LegalLayout title="Política de Privacidad y Tratamiento de Datos">
    <section>
      <p className="italic text-muted-foreground">
        En cumplimiento de la <strong className="text-foreground">Ley Estatutaria 1581 de 2012</strong>, el Decreto 1377 de 2013
        y demás normas concordantes sobre protección de datos personales en Colombia.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">1. Responsable del tratamiento</h2>
      <p>
        DeseoX Connect actúa como <strong>Responsable del Tratamiento</strong> de los datos personales recolectados a
        través de la plataforma <a href="https://deseo-x.com" className="text-accent hover:underline">deseo-x.com</a>.
        Contacto del oficial de privacidad:{" "}
        <a href="mailto:privacidad@deseo-x.com" className="text-accent hover:underline">privacidad@deseo-x.com</a>.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">2. Datos que recolectamos</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Identificación:</strong> nombre, alias, fecha de nacimiento.</li>
        <li><strong>Contacto:</strong> correo electrónico y, opcionalmente, número telefónico.</li>
        <li><strong>Ubicación:</strong> ciudad/departamento de Colombia para mostrar perfiles cercanos.</li>
        <li><strong>Verificación KYC:</strong> documento de identidad oficial y selfie de validación (purgados tras la aprobación).</li>
        <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo, logs de acceso para seguridad.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">3. Finalidad del tratamiento</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Verificar la identidad y mayoría de edad del usuario.</li>
        <li>Operar, mantener y mejorar la plataforma de conexión.</li>
        <li>Prevenir fraude, suplantación y actividades ilícitas (ciberseguridad).</li>
        <li>Cumplir requerimientos legales y judiciales.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">4. Derechos del titular (Habeas Data)</h2>
      <p>Como titular de los datos, tienes derecho a:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Conocer, actualizar y rectificar</strong> tus datos personales.</li>
        <li><strong>Solicitar prueba</strong> de la autorización otorgada.</li>
        <li><strong>Ser informado</strong> sobre el uso dado a tus datos.</li>
        <li><strong>Revocar la autorización</strong> y/o solicitar la <strong>supresión (eliminación)</strong> del dato cuando no exista deber legal de conservarlo.</li>
        <li>Presentar quejas ante la <strong>Superintendencia de Industria y Comercio (SIC)</strong>.</li>
      </ul>
      <p className="mt-3">
        Para ejercer estos derechos, escribe a{" "}
        <a href="mailto:privacidad@deseo-x.com" className="text-accent hover:underline">privacidad@deseo-x.com</a>.
        Responderemos dentro de los términos legales (15 días hábiles para consultas, 15 días hábiles para reclamos).
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">5. Seguridad de la información</h2>
      <p>
        Aplicamos medidas técnicas, humanas y administrativas razonables: cifrado en tránsito (HTTPS/TLS), cifrado en
        reposo, controles de acceso por roles (RLS), monitoreo de eventos y purga automática de documentos de
        identidad una vez completada la verificación.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">6. Conservación</h2>
      <p>
        Los datos se conservan mientras la cuenta esté activa o sea necesario para cumplir las finalidades. Tras la
        eliminación de la cuenta, los datos se borran salvo aquellos que la ley obligue a conservar.
      </p>
    </section>
  </LegalLayout>
);

export default Privacidad;
