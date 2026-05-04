// Departamentos y ciudades principales de Colombia (subset representativo)
export const COLOMBIA: Record<string, string[]> = {
  "Antioquia": ["Medellín", "Envigado", "Bello", "Itagüí", "Sabaneta", "Rionegro"],
  "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia"],
  "Bogotá D.C.": ["Bogotá"],
  "Bolívar": ["Cartagena", "Magangué", "Turbaco"],
  "Boyacá": ["Tunja", "Duitama", "Sogamoso"],
  "Caldas": ["Manizales", "Villamaría", "Chinchiná"],
  "Cauca": ["Popayán", "Santander de Quilichao"],
  "Cesar": ["Valledupar", "Aguachica"],
  "Córdoba": ["Montería", "Cereté", "Lorica"],
  "Cundinamarca": ["Soacha", "Chía", "Zipaquirá", "Facatativá", "Girardot"],
  "Huila": ["Neiva", "Pitalito"],
  "La Guajira": ["Riohacha", "Maicao"],
  "Magdalena": ["Santa Marta", "Ciénaga"],
  "Meta": ["Villavicencio", "Acacías"],
  "Nariño": ["Pasto", "Ipiales", "Tumaco"],
  "Norte de Santander": ["Cúcuta", "Ocaña", "Pamplona"],
  "Quindío": ["Armenia", "Calarcá"],
  "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"],
  "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta"],
  "Sucre": ["Sincelejo", "Corozal"],
  "Tolima": ["Ibagué", "Espinal", "Honda"],
  "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá", "Buga"],
};

export const DEPARTMENTS = Object.keys(COLOMBIA).sort();

/**
 * Zonas / localidades específicas para ciudades grandes.
 * Se usan en el selector "Zona de trabajo" del perfil y en los filtros
 * de la página principal cuando la ciudad seleccionada las tiene definidas.
 */
export const CITY_ZONES: Record<string, string[]> = {
  "Bogotá": [
    "Usaquén",
    "Chapinero",
    "Santa Fe",
    "San Cristóbal",
    "Usme",
    "Tunjuelito",
    "Bosa",
    "Kennedy",
    "Fontibón",
    "Engativá",
    "Suba",
    "Barrios Unidos",
    "Teusaquillo",
    "Los Mártires",
    "Antonio Nariño",
    "Puente Aranda",
    "La Candelaria",
    "Rafael Uribe Uribe",
    "Ciudad Bolívar",
    "Sumapaz",
    "Soacha",
  ],
  "Medellín": [
    "El Poblado",
    "Laureles",
    "Belén",
    "Guayabal",
    "Aranjuez",
    "Manrique",
    "Robledo",
    "Envigado",
    "Itagüí",
    "Sabaneta",
    "Bello",
  ],
};

export const getCityZones = (city?: string | null): string[] =>
  (city && CITY_ZONES[city]) || [];
