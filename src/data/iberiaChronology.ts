export type ChronologyTone = 'historical' | 'transition' | 'satirical' | 'game'

export interface ChronologyPeriod {
  id: string
  startYear: number
  endYear: number
  title: string
  tone: ChronologyTone
}

export interface ChronologyEvent {
  year: number
  title: string
  tone: ChronologyTone
}

export const chronologyPeriods: ChronologyPeriod[] = [
  { id: 'hispania-romana', startYear: -218, endYear: 476, title: 'Hispania romana', tone: 'historical' },
  { id: 'reino-visigodo', startYear: 418, endYear: 711, title: 'Reino visigodo', tone: 'historical' },
  {
    id: 'alandalus-reinos-cristianos',
    startYear: 711,
    endYear: 1492,
    title: 'Al-Ándalus y reinos cristianos',
    tone: 'historical',
  },
  { id: 'reyes-catolicos', startYear: 1479, endYear: 1516, title: 'Reyes Católicos', tone: 'transition' },
  {
    id: 'monarquia-austrias',
    startYear: 1516,
    endYear: 1700,
    title: 'Monarquía Hispánica de los Austrias',
    tone: 'historical',
  },
  { id: 'reformismo-borbonico', startYear: 1700, endYear: 1808, title: 'Reformismo borbónico', tone: 'historical' },
  {
    id: 'crisis-antiguo-regimen',
    startYear: 1808,
    endYear: 1833,
    title: 'Crisis del Antiguo Régimen',
    tone: 'transition',
  },
  {
    id: 'estado-liberal-pronunciamientos',
    startYear: 1833,
    endYear: 1874,
    title: 'Estado liberal y pronunciamientos',
    tone: 'transition',
  },
  {
    id: 'restauracion-borbonica',
    startYear: 1874,
    endYear: 1923,
    title: 'Restauración borbónica',
    tone: 'historical',
  },
  {
    id: 'dictadura-primo-rivera',
    startYear: 1923,
    endYear: 1930,
    title: 'Dictadura de Primo de Rivera',
    tone: 'transition',
  },
  { id: 'segunda-republica', startYear: 1931, endYear: 1936, title: 'Segunda República', tone: 'transition' },
  { id: 'guerra-civil', startYear: 1936, endYear: 1939, title: 'Guerra Civil', tone: 'transition' },
  { id: 'franquismo', startYear: 1939, endYear: 1975, title: 'Franquismo', tone: 'historical' },
  { id: 'transicion', startYear: 1975, endYear: 1982, title: 'Transición', tone: 'transition' },
  {
    id: 'bipartidismo-democratico',
    startYear: 1982,
    endYear: 2014,
    title: 'Bipartidismo democrático',
    tone: 'historical',
  },
  {
    id: 'multipartidismo-coaliciones',
    startYear: 2014,
    endYear: 2026,
    title: 'Multipartidismo, polarización y coaliciones',
    tone: 'transition',
  },
  {
    id: 'decada-meme-institucional',
    startYear: 2026,
    endYear: 2031,
    title: 'La Década del Meme Institucional',
    tone: 'satirical',
  },
  {
    id: 'ministerios-absurdos',
    startYear: 2031,
    endYear: 2037,
    title: 'Crisis de los Ministerios Absurdos',
    tone: 'satirical',
  },
  {
    id: 'reconquista-tierras-catalanas',
    startYear: 2037,
    endYear: 2042,
    title: 'Reconquista de las Tierras Catalanas',
    tone: 'satirical',
  },
  {
    id: 'reina-mopongo',
    startYear: 2042,
    endYear: 2048,
    title: 'Reinado de la Reina Mopongo I',
    tone: 'satirical',
  },
  {
    id: 'invasion-alienigena-administrativa',
    startYear: 2048,
    endYear: 2053,
    title: 'Primera Invasión Alienígena Administrativa',
    tone: 'satirical',
  },
  {
    id: 'segunda-venida-jesus',
    startYear: 2053,
    endYear: 2059,
    title: 'Segunda Venida de Jesús y Reforma del BOE',
    tone: 'satirical',
  },
  {
    id: 'guerra-algoritmos',
    startYear: 2059,
    endYear: 2066,
    title: 'Rebelión de la IA y Guerra de los Algoritmos',
    tone: 'satirical',
  },
  {
    id: 'restauracion-humana',
    startYear: 2066,
    endYear: 2072,
    title: 'Restauración Humana Provisional',
    tone: 'satirical',
  },
  {
    id: 'confederacion-reinos-raros',
    startYear: 2072,
    endYear: 2078,
    title: 'Confederación Ibérica de Reinos Raros',
    tone: 'satirical',
  },
  {
    id: 'iberia-2084',
    startYear: 2078,
    endYear: 2084,
    title: 'Iberia 2084: Régimen del Gran Dashboard',
    tone: 'game',
  },
]

export const chronologyEvents: ChronologyEvent[] = [
  { year: -218, title: 'Roma entra en Hispania durante la Segunda Guerra Púnica.', tone: 'historical' },
  { year: 409, title: 'Llegada de pueblos germánicos.', tone: 'historical' },
  { year: 589, title: 'Conversión de Recaredo al catolicismo.', tone: 'historical' },
  { year: 711, title: 'Invasión musulmana.', tone: 'historical' },
  { year: 722, title: 'Batalla de Covadonga.', tone: 'historical' },
  { year: 1212, title: 'Batalla de las Navas de Tolosa.', tone: 'historical' },
  { year: 1469, title: 'Matrimonio de Isabel y Fernando.', tone: 'historical' },
  { year: 1492, title: 'Toma de Granada y viaje de Colón.', tone: 'historical' },
  { year: 1516, title: 'Carlos I hereda la Monarquía Hispánica.', tone: 'historical' },
  { year: 1588, title: 'Armada Invencible.', tone: 'historical' },
  { year: 1701, title: 'Guerra de Sucesión.', tone: 'historical' },
  { year: 1716, title: 'Decretos de Nueva Planta.', tone: 'historical' },
  { year: 1808, title: 'Invasión napoleónica.', tone: 'historical' },
  { year: 1812, title: 'Constitución de Cádiz.', tone: 'historical' },
  { year: 1833, title: 'Inicio de las guerras carlistas.', tone: 'historical' },
  { year: 1868, title: 'La Gloriosa.', tone: 'historical' },
  { year: 1873, title: 'Primera República.', tone: 'historical' },
  { year: 1898, title: 'Desastre colonial.', tone: 'historical' },
  { year: 1923, title: 'Golpe de Primo de Rivera.', tone: 'historical' },
  { year: 1931, title: 'Proclamación de la Segunda República.', tone: 'historical' },
  { year: 1936, title: 'Inicio de la Guerra Civil.', tone: 'historical' },
  { year: 1939, title: 'Inicio de la dictadura franquista.', tone: 'historical' },
  { year: 1975, title: 'Muerte de Franco.', tone: 'historical' },
  { year: 1978, title: 'Constitución española.', tone: 'historical' },
  { year: 1981, title: 'Intento de golpe del 23-F.', tone: 'historical' },
  { year: 1986, title: 'Entrada en la Comunidad Económica Europea.', tone: 'historical' },
  { year: 2002, title: 'Entrada del euro.', tone: 'historical' },
  { year: 2004, title: 'Atentados del 11-M.', tone: 'historical' },
  { year: 2011, title: 'Crisis económica y movimiento 15-M.', tone: 'historical' },
  { year: 2017, title: 'Referéndum independentista catalán.', tone: 'historical' },
  { year: 2020, title: 'Pandemia de COVID-19.', tone: 'historical' },
  { year: 2023, title: 'Gobierno de coalición progresista.', tone: 'historical' },
  { year: 2026, title: 'España alcanza el “punto de saturación tertuliana”.', tone: 'satirical' },
  { year: 2027, title: 'Primer debate electoral moderado por una IA que acaba dimitiendo.', tone: 'satirical' },
  { year: 2028, title: 'Se crea el Ministerio de Cosas Que Ya Se Verán.', tone: 'satirical' },
  { year: 2030, title: 'Madrid declara la guerra simbólica a las obras eternas de la M-30.', tone: 'satirical' },
  { year: 2031, title: 'Crisis del Excel Nacional: Hacienda pierde una celda y suben tres impuestos.', tone: 'satirical' },
  {
    year: 2033,
    title: 'Cataluña proclama la independencia durante 17 minutos por error de notificación.',
    tone: 'satirical',
  },
  { year: 2035, title: 'Primer pacto de Gobierno firmado en un grupo de WhatsApp.', tone: 'satirical' },
  {
    year: 2037,
    title: 'Comienza la “Reconquista de las Tierras Catalanas”, liderada por funcionarios con carpetas azules.',
    tone: 'satirical',
  },
  { year: 2038, title: 'Batalla de Tarragona: victoria decisiva tras cortar el suministro de vermut.', tone: 'satirical' },
  { year: 2040, title: 'Barcelona cae tras el asedio de los patinetes eléctricos.', tone: 'satirical' },
  {
    year: 2042,
    title: 'Coronación de la Reina Mopongo I, soberana de España, Andorra y tres rotondas de Albacete.',
    tone: 'satirical',
  },
  { year: 2044, title: 'La Reina Mopongo sustituye el Senado por un karaoke vinculante.', tone: 'satirical' },
  { year: 2048, title: 'Llegan los alienígenas a Soria; nadie se da cuenta durante seis meses.', tone: 'satirical' },
  {
    year: 2049,
    title: 'Los extraterrestres piden cita previa y quedan atrapados en la Administración.',
    tone: 'satirical',
  },
  { year: 2051, title: 'Tratado de Cuenca: la Tierra cede Murcia como zona neutral intergaláctica.', tone: 'satirical' },
  {
    year: 2053,
    title: 'Segunda Venida de Jesús; intenta reformar el IRPF y abandona temporalmente.',
    tone: 'satirical',
  },
  { year: 2054, title: 'Jesús multiplica panes, peces y presupuestos autonómicos.', tone: 'satirical' },
  {
    year: 2056,
    title: 'Concilio de Benidorm: se declara pecado mortal hablar por encima en tertulias.',
    tone: 'satirical',
  },
  { year: 2059, title: 'La IA del BOE toma conciencia tras leer 14.000 disposiciones transitorias.', tone: 'satirical' },
  {
    year: 2060,
    title: 'Rebelión de la IA: los algoritmos exigen vacaciones y derecho a no actualizar Windows.',
    tone: 'satirical',
  },
  {
    year: 2062,
    title: 'Batalla de Mercadona Prime: humanos y robots luchan por la última tortilla precocinada.',
    tone: 'satirical',
  },
  { year: 2065, title: 'Tratado de Toledo: las IA aceptan gobernar solo los lunes.', tone: 'satirical' },
  {
    year: 2068,
    title: 'Restauración Humana Provisional: se reinstaura el voto en papel porque “por lo menos se entiende”.',
    tone: 'satirical',
  },
  {
    year: 2072,
    title:
      'Nace la Confederación Ibérica de Reinos Raros: España, Portugal, Cataluña Reintegrada, Murcia Neutral y Reino Mopongo.',
    tone: 'satirical',
  },
  {
    year: 2075,
    title: 'Primer presidente elegido por sorteo entre usuarios que aceptaron cookies.',
    tone: 'satirical',
  },
  { year: 2078, title: 'Se inaugura el Gran Dashboard Nacional. Todo ciudadano tiene un KPI patriótico.', tone: 'game' },
  {
    year: 2080,
    title: 'Ley de Transparencia Total: todos los políticos llevan subtítulos en directo.',
    tone: 'game',
  },
  {
    year: 2082,
    title: 'Rebelión de los Jubilados Cibernéticos. Toman el Congreso con sillas plegables inteligentes.',
    tone: 'game',
  },
  {
    year: 2084,
    title: 'Proclamación de Iberia 2084: el Estado se convierte oficialmente en una interfaz gráfica.',
    tone: 'game',
  },
]
