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
