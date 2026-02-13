'use client'

import { useState, useEffect, useCallback } from 'react'

// Team configuration with 2025 season data
const TEAM_CONFIG: Record<string, {
  color: string
  textDark?: boolean
  shortName: string
  aliases: string[]
}> = {
  'McLaren': {
    color: '#FF8000',
    shortName: 'MCL',
    aliases: ['McLaren F1 Team', 'McLaren Formula 1 Team', 'McLaren Mercedes']
  },
  'Ferrari': {
    color: '#E80020',
    shortName: 'FER',
    aliases: ['Scuderia Ferrari', 'Scuderia Ferrari Mission Winnow', 'Ferrari']
  },
  'Red Bull Racing': {
    color: '#3671C6',
    shortName: 'RBR',
    aliases: ['Red Bull', 'Red Bull Racing Honda RBPT', 'Red Bull Racing Honda']
  },
  'Mercedes': {
    color: '#27F4D2',
    shortName: 'MER',
    aliases: ['Mercedes-AMG Petronas', 'Mercedes-AMG', 'Mercedes Formula 1 Team']
  },
  'Aston Martin': {
    color: '#229971',
    shortName: 'AMR',
    aliases: ['Aston Martin Aramco', 'Aston Martin F1 Team', 'Aston Martin Cognizant']
  },
  'Alpine': {
    color: '#0093CC',
    shortName: 'ALP',
    aliases: ['Alpine F1 Team', 'Alpine Renault', 'BWT Alpine F1 Team']
  },
  'Williams': {
    color: '#64C4FF',
    shortName: 'WIL',
    aliases: ['Williams Racing', 'Williams F1', 'Williams Mercedes']
  },
  'RB': {
    color: '#6692FF',
    shortName: 'RB',
    aliases: ['Visa RB', 'RB F1 Team', 'AlphaTauri', 'Scuderia AlphaTauri', 'Toro Rosso']
  },
  'Kick Sauber': {
    color: '#52E252',
    shortName: 'SAU',
    aliases: ['Sauber', 'Stake F1 Team', 'Stake F1 Team Kick Sauber', 'Alfa Romeo', 'Alfa Romeo Racing']
  },
  'Haas': {
    color: '#B6BABD',
    textDark: true,
    shortName: 'HAS',
    aliases: ['Haas F1 Team', 'MoneyGram Haas F1 Team', 'Haas Ferrari']
  }
}

// Get team config with fallback
function getTeamConfig(teamName: string) {
  const normalizedName = teamName
    .replace(/\s+Formula.*$/i, '')
    .replace(/\s+F1.*$/i, '')
    .replace(/\s+Team$/i, '')
    .trim()

  // Direct match
  if (TEAM_CONFIG[normalizedName]) {
    return TEAM_CONFIG[normalizedName]
  }

  // Check aliases
  for (const [name, config] of Object.entries(TEAM_CONFIG)) {
    if (config.aliases.some(alias => 
      alias.toLowerCase() === normalizedName.toLowerCase() ||
      normalizedName.toLowerCase().includes(alias.toLowerCase()) ||
      alias.toLowerCase().includes(normalizedName.toLowerCase())
    )) {
      return config
    }
  }

  // Fallback
  return {
    color: '#666666',
    shortName: normalizedName.substring(0, 3).toUpperCase(),
    aliases: []
  }
}

// SVG-based team logo component with fallback
function TeamLogo({ teamName, size = 40 }: { teamName: string; size?: number }) {
  const config = getTeamConfig(teamName)
  
  // Generate initials for fallback
  const initials = config.shortName

  return (
    <div 
      className="team-logo-container"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: config.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: config.textDark ? '#1a1a1a' : '#ffffff',
        fontWeight: 700,
        fontSize: size * 0.35,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
      title={teamName}
    >
      {initials}
    </div>
  )
}

// Types
interface Driver {
  name?: string
  surname?: string
  givenName?: string
  familyName?: string
}

interface Team {
  teamName?: string
}

interface Result {
  position?: number | string
  gridPosition?: number | string
  laps?: number | string
  time?: string
  status?: string
  q1?: string
  q2?: string
  q3?: string
  driver?: Driver
  driverId?: string
  team?: Team
  teamName?: string
  fastestLap?: { time?: string }
}

interface Race {
  round: number | string
  raceName: string
  results?: Result[]
  qualyResults?: Result[]
  sprintRaceResults?: Result[]
  fp1Results?: Result[]
  fp2Results?: Result[]
  fp3Results?: Result[]
}

interface ApiResponse {
  season?: string | number
  races?: Race[]
}

export default function Home() {
  const [isDark, setIsDark] = useState(true)
  const [year, setYear] = useState('2025')
  const [round, setRound] = useState('')
  const [sessionType, setSessionType] = useState('race')
  const [races, setRaces] = useState<Race[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [raceInfo, setRaceInfo] = useState<{ name: string; season: string; round: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Generate years from 1950 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => String(currentYear - i))

  // Load races for selected year
  const loadRaces = useCallback(async () => {
    try {
      const response = await fetch(`/api/f1/races?year=${year}`)
      const data: ApiResponse = await response.json()
      let raceList = data.races || []
      
      // Remove duplicates based on raceName (keep first occurrence)
      const seenNames = new Set<string>()
      raceList = raceList.filter(race => {
        const normalizedName = race.raceName.replace(' Grand Prix', '').trim()
        if (seenNames.has(normalizedName)) {
          return false
        }
        seenNames.add(normalizedName)
        return true
      })
      
      setRaces(raceList)
      if (raceList.length > 0) {
        setRound(String(raceList[0].round))
      }
    } catch (err) {
      console.error('Error loading races:', err)
    }
  }, [year])

  useEffect(() => {
    loadRaces()
  }, [loadRaces])

  // Get availability info for session types by year
  const getSessionAvailabilityInfo = (sessionType: string, yearNum: number): { available: boolean; message: string } => {
    switch (sessionType) {
      case 'sprint':
        if (yearNum < 2021) {
          return { 
            available: false, 
            message: 'Las carreras Sprint se introdujeron en la Fórmula 1 en 2021. No existen datos de Sprint para temporadas anteriores.' 
          }
        }
        // Sprints weren't in every race, so data may not exist even for 2021+
        return { 
          available: true, 
          message: 'Las carreras Sprint solo se disputan en ciertos Grandes Premios. Es posible que este GP no tuviera sesión Sprint.' 
        }
      case 'fp1':
      case 'fp2':
      case 'fp3':
        if (yearNum < 2003) {
          return { 
            available: false, 
            message: `Los datos de sesiones de práctica libre (FP1, FP2, FP3) no están disponibles en los registros oficiales para temporadas anteriores a 2003. La FIA comenzó a registrar sistemáticamente estos datos a partir de esa temporada.` 
          }
        }
        return { available: true, message: '' }
      case 'qualifying':
        if (yearNum < 1995) {
          return { 
            available: false, 
            message: 'Los datos detallados de clasificación anteriores a 1995 son limitados en los registros oficiales. El formato de clasificación ha cambiado múltiples veces a lo largo de la historia de la F1 (desde el formato de una hora, pasando por las eliminaciones de 107%, hasta el actual sistema Q1/Q2/Q3 establecido en 2006).' 
          }
        }
        return { available: true, message: '' }
      case 'race':
        return { available: true, message: '' }
      default:
        return { available: true, message: '' }
    }
  }

  // Load results
  const loadResults = async () => {
    if (!round) {
      setError('Por favor selecciona un Gran Premio')
      return
    }

    setLoading(true)
    setError('')
    setResults([])
    setRaceInfo(null)

    const yearNum = parseInt(year)

    try {
      const response = await fetch(`/api/f1/races?year=${year}&round=${round}&type=${sessionType}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      let raceResults: Result[] = []
      let raceName = 'Carrera'

      const raceData = data.races || data

      switch (sessionType) {
        case 'qualifying':
          raceResults = raceData.qualyResults || []
          raceName = raceData.raceName || 'Clasificación'
          break
        case 'sprint':
          raceResults = raceData.sprintRaceResults || []
          raceName = raceData.raceName || 'Sprint'
          break
        case 'fp1':
          raceResults = raceData.fp1Results || []
          raceName = raceData.raceName || 'FP1'
          break
        case 'fp2':
          raceResults = raceData.fp2Results || []
          raceName = raceData.raceName || 'FP2'
          break
        case 'fp3':
          raceResults = raceData.fp3Results || []
          raceName = raceData.raceName || 'FP3'
          break
        default:
          raceResults = raceData.results || []
          raceName = raceData.raceName || 'Carrera'
      }

      // Check if no results and provide helpful message
      if (!raceResults || raceResults.length === 0) {
        const availabilityInfo = getSessionAvailabilityInfo(sessionType, yearNum)
        
        // Set race info even if no results, to show context
        setRaceInfo({
          name: raceName,
          season: String(data.season || year),
          round: String(raceData.round || round)
        })

        if (!availabilityInfo.available) {
          setError(availabilityInfo.message)
        } else if (availabilityInfo.message) {
          // Session type exists but this specific GP may not have had it
          setError(availabilityInfo.message)
        } else {
          // Generic message for data not available
          setError(`No hay datos registrados en los archivos oficiales de la Fórmula 1 para la sesión de ${sessionLabels[sessionType]} de este Gran Premio. Esto puede deberse a que la sesión no se disputó, fue cancelada, o los datos históricos no fueron preservados.`)
        }
        return
      }

      setResults(raceResults)
      setRaceInfo({
        name: raceName,
        season: String(data.season || year),
        round: String(raceData.round || round)
      })
    } catch (err) {
      // Check if it's a network/API error vs data availability
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar resultados'
      
      if (errorMessage.includes('HTTP') || errorMessage.includes('fetch')) {
        setError('Error de conexión con la API de Fórmula 1. Por favor, intenta nuevamente más tarde.')
      } else {
        setError(`No se pudieron obtener los datos. Los registros históricos de la Fórmula 1 pueden tener limitaciones para algunas sesiones y temporadas antiguas.\n\nDetalles: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Load last race
  const loadCurrent = async () => {
    try {
      const response = await fetch('/api/f1/races')
      const data: ApiResponse = await response.json()
      
      if (data.races && data.races.length > 0) {
        // Remove duplicates based on raceName
        const seenNames = new Set<string>()
        let raceList = data.races.filter(race => {
          const normalizedName = race.raceName.replace(' Grand Prix', '').trim()
          if (seenNames.has(normalizedName)) {
            return false
          }
          seenNames.add(normalizedName)
          return true
        })
        
        setYear(String(data.season || '2025'))
        setRaces(raceList)
        const lastRace = raceList[raceList.length - 1]
        setRound(String(lastRace.round))
        
        // Auto-load results
        setTimeout(() => {
          loadResults()
        }, 100)
      }
    } catch (err) {
      console.error('Error loading current race:', err)
    }
  }

  // Get driver name
  const getDriverName = (result: Result) => {
    if (result.driver?.name && result.driver?.surname) {
      return `${result.driver.name} ${result.driver.surname}`
    }
    if (result.driver?.givenName && result.driver?.familyName) {
      return `${result.driver.givenName} ${result.driver.familyName}`
    }
    if (result.driver?.surname) {
      return result.driver.surname
    }
    return result.driverId || 'Desconocido'
  }

  // Get team name
  const getTeamName = (result: Result) => {
    return result.team?.teamName || result.teamName || 'Desconocido'
  }

  // Get time display
  const getTimeDisplay = (result: Result) => {
    if (sessionType === 'qualifying') {
      return result.q3 || result.q2 || result.q1 || '---'
    }
    if (result.time) return result.time
    if (result.status) return result.status
    if (result.fastestLap?.time) return result.fastestLap.time
    return '---'
  }

  // Get position
  const getPosition = (result: Result) => {
    if (sessionType === 'qualifying') {
      return result.gridPosition || result.position || '---'
    }
    return result.position || '---'
  }

  const sessionLabels: Record<string, string> = {
    race: 'Carrera',
    qualifying: 'Clasificación',
    sprint: 'Sprint',
    fp1: 'FP1',
    fp2: 'FP2',
    fp3: 'FP3'
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a0a0f] text-white' : 'bg-[#f5f5f8] text-[#1a1a1a]'}`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');
        
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
        
        .f1-gradient {
          background: linear-gradient(135deg, #e10600 0%, #ff4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #e10600 0%, #b30500 100%);
          box-shadow: 0 4px 15px rgba(225, 6, 0, 0.4);
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(225, 6, 0, 0.5);
        }
        
        .toggle-slider {
          position: relative;
          cursor: pointer;
          width: 56px;
          height: 28px;
          background: ${isDark ? '#1f1f27' : '#eeeeee'};
          border: 2px solid ${isDark ? '#2a2a35' : '#dddddd'};
          border-radius: 28px;
          transition: 0.3s;
        }
        
        .toggle-slider::before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 2px;
          bottom: 2px;
          background: #e10600;
          border-radius: 50%;
          transition: 0.3s;
          ${!isDark ? 'transform: translateX(28px);' : ''}
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        
        .table-row-animate {
          animation: fadeIn 0.3s ease forwards;
        }

        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .title-shine {
          background: linear-gradient(
            90deg,
            ${isDark ? '#ffffff' : '#1a1a1a'} 0%,
            ${isDark ? '#ffffff' : '#1a1a1a'} 40%,
            #e10600 50%,
            ${isDark ? '#ffffff' : '#1a1a1a'} 60%,
            ${isDark ? '#ffffff' : '#1a1a1a'} 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 3s linear infinite;
        }

        .header-gradient {
          background: ${isDark 
            ? 'linear-gradient(135deg, rgba(225,6,0,0.1) 0%, rgba(21,21,30,0.8) 50%, rgba(225,6,0,0.05) 100%)' 
            : 'linear-gradient(135deg, rgba(225,6,0,0.08) 0%, rgba(255,255,255,0.9) 50%, rgba(225,6,0,0.03) 100%)'
          };
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        .logo-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto p-5">
        {/* Header */}
        <header className={`flex justify-between items-center flex-wrap gap-4 mb-8 p-6 rounded-2xl header-gradient border ${isDark ? 'border-[#2a2a35]' : 'border-gray-200'} shadow-lg`}>
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="logo-float relative">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shadow-xl ${isDark ? 'ring-2 ring-[#e10600]/30' : 'ring-2 ring-[#e10600]/20'}`}>
                <img 
                  src="/f1-logo.png" 
                  alt="F1 Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#e10600] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">F1</span>
              </div>
            </div>
            
            {/* Title */}
            <div>
              <h1 className="font-orbitron text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-wider title-shine">
                HISTORIAL DE CARRERAS DE F1
              </h1>
              <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Resultados de Grandes Premios desde 1950
              </p>
            </div>
          </div>
          
          {/* Theme Toggle */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-full ${isDark ? 'bg-[#1f1f27]' : 'bg-gray-100'}`}>
            <span className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {isDark ? '🌙' : '☀️'}
            </span>
            <div 
              className="toggle-slider"
              onClick={() => setIsDark(!isDark)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsDark(!isDark)}
              aria-label="Cambiar tema"
            />
          </div>
        </header>

        {/* Filters */}
        <div className={`rounded-2xl p-5 mb-6 shadow-lg ${isDark ? 'bg-[#15151e]' : 'bg-white'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {/* Year */}
            <div className="flex flex-col gap-2">
              <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Temporada
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={`p-3 font-rajdhani text-base font-medium rounded-lg border-2 cursor-pointer transition-all outline-none ${
                  isDark 
                    ? 'bg-[#1f1f27] text-white border-[#2a2a35] focus:border-[#e10600]' 
                    : 'bg-[#eeeeee] text-[#1a1a1a] border-[#dddddd] focus:border-[#e10600]'
                }`}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Round */}
            <div className="flex flex-col gap-2">
              <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Gran Premio
              </label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className={`p-3 font-rajdhani text-base font-medium rounded-lg border-2 cursor-pointer transition-all outline-none ${
                  isDark 
                    ? 'bg-[#1f1f27] text-white border-[#2a2a35] focus:border-[#e10600]' 
                    : 'bg-[#eeeeee] text-[#1a1a1a] border-[#dddddd] focus:border-[#e10600]'
                }`}
              >
                {races.length === 0 ? (
                  <option value="">Cargando...</option>
                ) : (
                  races.map(race => (
                    <option key={race.round} value={String(race.round)}>
                      {race.raceName.replace(' Grand Prix', '')}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Session Type */}
            <div className="flex flex-col gap-2">
              <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Tipo de Sesión
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className={`p-3 font-rajdhani text-base font-medium rounded-lg border-2 cursor-pointer transition-all outline-none ${
                  isDark 
                    ? 'bg-[#1f1f27] text-white border-[#2a2a35] focus:border-[#e10600]' 
                    : 'bg-[#eeeeee] text-[#1a1a1a] border-[#dddddd] focus:border-[#e10600]'
                }`}
              >
                <option value="race">Carrera</option>
                <option value="qualifying">Clasificación</option>
                <option value="sprint">Sprint</option>
                <option value="fp1">FP1</option>
                <option value="fp2">FP2</option>
                <option value="fp3">FP3</option>
              </select>
              {/* Availability hint for old seasons */}
              {parseInt(year) < 2003 && (
                <span className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  ⚠️ Datos de práctica limitados antes de 2003
                </span>
              )}
              {parseInt(year) < 2021 && sessionType === 'sprint' && (
                <span className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  ⚠️ Sprint disponible desde 2021
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={loadResults}
              disabled={loading}
              className="btn-primary px-6 py-3 font-rajdhani text-base font-bold uppercase tracking-wider text-white rounded-lg transition-all disabled:opacity-50 flex-1 min-w-[140px]"
            >
              {loading ? '⏳ Cargando...' : '📊 Cargar Resultados'}
            </button>
            <button
              onClick={loadCurrent}
              className={`px-6 py-3 font-rajdhani text-base font-bold uppercase tracking-wider rounded-lg transition-all flex-1 min-w-[140px] border-2 ${
                isDark 
                  ? 'bg-[#1f1f27] text-white border-[#2a2a35] hover:border-[#e10600] hover:text-[#e10600]' 
                  : 'bg-[#eeeeee] text-[#1a1a1a] border-[#dddddd] hover:border-[#e10600] hover:text-[#e10600]'
              }`}
            >
              🏁 Última Carrera
            </button>
          </div>
        </div>

        {/* Race Info */}
        {raceInfo && (
          <div className={`rounded-2xl p-6 mb-6 shadow-lg fade-in ${isDark ? 'bg-[#15151e]' : 'bg-white'}`}>
            <h2 className="font-orbitron text-xl md:text-2xl font-bold mb-2 flex items-center flex-wrap gap-2">
              🏎️ {raceInfo.name}
              <span className="inline-block px-3 py-1 bg-[#e10600] text-white text-xs font-bold uppercase rounded">
                {sessionLabels[sessionType]}
              </span>
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Temporada {raceInfo.season} • Ronda {raceInfo.round}
            </p>
          </div>
        )}

        {/* Error / Info Message */}
        {error && (
          <div className={`rounded-xl p-6 mb-6 fade-in border ${
            error.includes('no están disponibles') || 
            error.includes('No hay datos') || 
            error.includes('no existen datos') ||
            error.includes('limitaciones')
              ? isDark 
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                : 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-red-500/10 border-[#e10600] text-[#e10600]'
          }`}>
            <strong className="block text-lg mb-3 flex items-center gap-2">
              {error.includes('no están disponibles') || 
               error.includes('No hay datos') || 
               error.includes('no existen datos') ||
               error.includes('limitaciones')
                ? 'ℹ️ Datos no disponibles'
                : '⚠️ Error al cargar'
              }
            </strong>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {error}
            </p>
          </div>
        )}

        {/* Results Table */}
        <div className={`rounded-2xl overflow-hidden shadow-lg ${isDark ? 'bg-[#15151e]' : 'bg-white'}`}>
          <table className="w-full border-collapse">
            <thead className={isDark ? 'bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0f]' : 'bg-gradient-to-r from-[#e0e0e0] to-[#d0d0d0]'}>
              <tr>
                <th className="p-4 text-left font-orbitron text-xs font-bold uppercase tracking-wider text-gray-400">Pos</th>
                <th className="p-4 text-left font-orbitron text-xs font-bold uppercase tracking-wider text-gray-400">Piloto</th>
                <th className="p-4 text-left font-orbitron text-xs font-bold uppercase tracking-wider text-gray-400 hidden sm:table-cell">Equipo</th>
                <th className="p-4 text-left font-orbitron text-xs font-bold uppercase tracking-wider text-gray-400">Tiempo</th>
                <th className="p-4 text-left font-orbitron text-xs font-bold uppercase tracking-wider text-gray-400">Vueltas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={`p-16 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cargando resultados...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`p-16 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Selecciona un Gran Premio para ver los resultados
                  </td>
                </tr>
              ) : (
                results.map((result, index) => {
                  const teamName = getTeamName(result)
                  return (
                    <tr
                      key={index}
                      className={`table-row-animate transition-colors ${
                        isDark 
                          ? 'even:bg-white/[0.02] hover:bg-[#e10600]/10' 
                          : 'even:bg-black/[0.02] hover:bg-[#e10600]/10'
                      }`}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <td className="p-4 font-orbitron text-xl font-black text-[#e10600]">
                        {getPosition(result)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-base">{getDriverName(result)}</span>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <div className="flex items-center gap-3">
                          <TeamLogo teamName={teamName} />
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {teamName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-sm">
                        {getTimeDisplay(result)}
                      </td>
                      <td className="p-4">
                        {result.laps != null ? result.laps : '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
