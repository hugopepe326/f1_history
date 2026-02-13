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
      const raceList = data.races || []
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

      if (!raceResults || raceResults.length === 0) {
        throw new Error('No hay datos disponibles para esta sesión')
      }

      setResults(raceResults)
      setRaceInfo({
        name: raceName,
        season: String(data.season || year),
        round: String(raceData.round || round)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar resultados')
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
        setYear(String(data.season || '2025'))
        setRaces(data.races)
        const lastRace = data.races[data.races.length - 1]
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
      `}</style>

      <div className="max-w-[1200px] mx-auto p-5">
        {/* Header */}
        <header className="flex justify-between items-center flex-wrap gap-4 mb-8 pb-5 border-b-2 border-[#e10600]">
          <div>
            <h1 className="font-orbitron text-2xl md:text-3xl font-black tracking-wider f1-gradient">
              🏎️ HISTORIAL F1
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Resultados de Grandes Premios de Fórmula 1
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Modo Oscuro
            </span>
            <div 
              className="toggle-slider"
              onClick={() => setIsDark(!isDark)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsDark(!isDark)}
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

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-[#e10600] rounded-xl p-6 mb-6 text-[#e10600] fade-in">
            <strong className="block text-lg mb-2">⚠️ Error al cargar</strong>
            {error}
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
