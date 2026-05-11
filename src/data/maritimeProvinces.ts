const maritimeProvinceCodes = new Set<string>([
  'a-coruna',
  'alicante',
  'almeria',
  'asturias',
  'barcelona',
  'bizkaia',
  'cadiz',
  'cantabria',
  'castellon',
  'ceuta',
  'gipuzkoa',
  'girona',
  'granada',
  'huelva',
  'illes-balears',
  'las-palmas',
  'lugo',
  'malaga',
  'melilla',
  'murcia',
  'pontevedra',
  'santa-cruz-de-tenerife',
  'tarragona',
  'valencia',
])

export function isMaritimeProvince(code?: string | null): boolean {
  return Boolean(code && maritimeProvinceCodes.has(code))
}
