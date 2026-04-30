import { LegalLayout } from "./LegalLayout";

const Privacidad = () => (
  <LegalLayout title="Política de Privacidad y Tratamiento de Datos" updatedAt="Abril 2026">
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">1. Cumplimiento Legal</h2>
      <p>
        En cumplimiento de la <strong>Ley 1581 de 2012</strong> y el <strong>Decreto 1377 de 2013</strong>,
        DeseoX Connect actúa como <strong>Responsable del Tratamiento</strong> de los datos recolectados en{" "}
        <a href="https://deseo-x.com" className="text-accent hover:underline">deseo-x.com</a>.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">2. Datos Recolectados y Finalidad</h2>
      <p>Recopilamos datos de identificación, contacto, ubicación y técnicos con el fin de:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>Verificar la mayoría de edad y autenticidad del perfil <strong>(Proceso KYC)</strong>.</li>
        <li>Garantizar la seguridad de la plataforma y prevenir el fraude <strong>(Ciberseguridad)</strong>.</li>
        <li>Facilitar la conexión técnica entre usuarios.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">3. Seguridad de la Información (Protocolos Técnicos)</h2>
      <p>Para proteger la integridad de la comunidad, aplicamos:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>
          <strong>Cifrado en Tránsito y Reposo:</strong> uso de protocolos HTTPS/TLS y almacenamiento cifrado.
        </li>
        <li>
          <strong>Seguridad por Roles (RLS):</strong> acceso restringido a los datos según el nivel de autorización.
        </li>
        <li>
          <strong>Purga KYC:</strong> los documentos de identidad se eliminan permanentemente de nuestros servidores
          una vez aprobada la verificación.
        </li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">4. Derechos del Titular (Habeas Data)</h2>
      <p>
        Los usuarios pueden <strong>conocer, actualizar, rectificar o solicitar la supresión</strong> de sus datos
        escribiendo a{" "}
        <a href="mailto:privacidad@deseo-x.com" className="text-accent hover:underline">
          privacidad@deseo-x.com
        </a>
        . Las solicitudes se atenderán en un máximo de <strong>15 días hábiles</strong>.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">5. Uso de Cookies</h2>
      <p>
        Utilizamos cookies <strong>técnicas necesarias</strong> para mantener la sesión segura y prevenir ataques de
        denegación de servicio o suplantación.
      </p>
    </section>
  </LegalLayout>
);

export default Privacidad;
