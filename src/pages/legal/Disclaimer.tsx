import { LegalLayout } from "./LegalLayout";

const Disclaimer = () => (
  <LegalLayout title="Descargo de Responsabilidad" updatedAt="Abril 2026">
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">1. Naturaleza de la plataforma</h2>
      <p>
        DeseoX Connect es <strong>únicamente una plataforma tecnológica de conexión digital entre personas adultas</strong>.
        No prestamos servicios personales, no intermediamos transacciones físicas y no representamos a ningún
        Creador registrado.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">2. Ausencia de vínculo laboral</h2>
      <p>
        Los Creadores son <strong>usuarios independientes</strong>. <strong>No existe ningún tipo de vínculo laboral,
        comercial, societario ni de subordinación</strong> entre DeseoX y los Creadores. Cada Creador actúa por su
        propia cuenta y riesgo.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">3. Encuentros fuera de la plataforma</h2>
      <p>
        DeseoX <strong>no se responsabiliza por acuerdos, comunicaciones, intercambios económicos ni encuentros
        que ocurran fuera de la interfaz digital</strong>. Toda interacción presencial o por canales externos es
        responsabilidad exclusiva de los usuarios involucrados.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">4. Limitación de responsabilidad</h2>
      <p>
        En la máxima medida permitida por la ley colombiana, DeseoX no será responsable por daños directos,
        indirectos, incidentales o consecuentes derivados de: (i) la conducta de otros usuarios, (ii) la veracidad
        de la información publicada por terceros, (iii) interrupciones técnicas, o (iv) decisiones tomadas por el
        usuario con base en el contenido de la plataforma.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">5. Recomendaciones de seguridad</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>No compartas datos bancarios ni contraseñas con otros usuarios.</li>
        <li>Desconfía de solicitudes de pago anticipado fuera de la plataforma.</li>
        <li>Reporta cualquier comportamiento sospechoso al equipo de moderación.</li>
        <li>Si planeas un encuentro presencial, infórmaselo a una persona de confianza.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-foreground mb-2">6. Tolerancia cero</h2>
      <p>
        Reiteramos nuestra <strong>política de tolerancia cero frente a la explotación de menores y la trata de
        personas</strong>. Cualquier indicio será reportado de inmediato a las autoridades colombianas competentes.
      </p>
    </section>
  </LegalLayout>
);

export default Disclaimer;
