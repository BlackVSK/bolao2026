import { useState, useEffect } from 'react'
import { getStandings, getEnrichedMatches, getScorers } from '../api/worldCup'
import { getPredictions } from '../api/predictions'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'groups', label: '🗂️ Grupos' },
  { id: 'matches', label: '⚽ Jogos' },
  { id: 'scorers', label: '🥅 Artilharia' },
]

const STAGES = [
  { value: '', label: 'Todos' },
  { value: 'GROUP_STAGE', label: 'Fase de Grupos' },
  { value: 'ROUND_OF_16', label: 'Oitavas' },
  { value: 'QUARTER_FINALS', label: 'Quartas' },
  { value: 'SEMI_FINALS', label: 'Semifinais' },
  { value: 'FINAL', label: 'Final' },
]

// ── Grupos ────────────────────────────────────────────────────────────────────

function StandingsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getStandings()
      .then(setData)
      .catch(() => setError('Não foi possível carregar a classificação. Tente novamente.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState text="Carregando classificação..." />
  if (error) return <ErrorState message={error} />

  const standings = data?.standings ?? []

  return (
    <div className="space-y-6">
      {standings.map((group) => (
        <div key={group.group} className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-accent font-bold text-sm uppercase tracking-wider">
              {group.group}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-border">
                  <th className="px-4 py-2 text-left w-8">#</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-2 py-2 text-center">PJ</th>
                  <th className="px-2 py-2 text-center">V</th>
                  <th className="px-2 py-2 text-center">E</th>
                  <th className="px-2 py-2 text-center">D</th>
                  <th className="px-2 py-2 text-center">GP</th>
                  <th className="px-2 py-2 text-center">GC</th>
                  <th className="px-4 py-2 text-center font-bold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {group.table.map((row) => (
                  <tr
                    key={row.team.id}
                    className="border-b border-border last:border-0 hover:bg-card-hover transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 font-mono">{row.position}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.team.crest && (
                          <img
                            src={row.team.crest}
                            alt={row.team.name}
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className="text-white font-medium">{row.team.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center text-gray-300">{row.playedGames}</td>
                    <td className="px-2 py-3 text-center text-gray-300">{row.won}</td>
                    <td className="px-2 py-3 text-center text-gray-300">{row.draw}</td>
                    <td className="px-2 py-3 text-center text-gray-300">{row.lost}</td>
                    <td className="px-2 py-3 text-center text-gray-300">{row.goalsFor}</td>
                    <td className="px-2 py-3 text-center text-gray-300">{row.goalsAgainst}</td>
                    <td className="px-4 py-3 text-center font-bold text-accent">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Jogos ─────────────────────────────────────────────────────────────────────

function MatchesTab({ predictionIndex }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stage, setStage] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    getEnrichedMatches(stage || null)
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .catch(() => setError('Não foi possível carregar os jogos. Tente novamente.'))
      .finally(() => setLoading(false))
  }, [stage])

  return (
    <div className="space-y-4">
      {/* Filtro de fase */}
      <div className="flex gap-2 flex-wrap">
        {STAGES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStage(s.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              stage === s.value
                ? 'bg-primary text-accent'
                : 'text-gray-400 hover:bg-card-hover hover:text-white border border-border'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading && <LoadingState text="Carregando jogos..." />}
      {error && <ErrorState message={error} />}

      {!loading && !error && matches.length === 0 && (
        <div className="text-center py-12 text-gray-500">Nenhum jogo encontrado para esta fase.</div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="space-y-2">
          {matches.map((match) => {
            const bolaoMatch = match.bolao_match
            const prediction = bolaoMatch ? predictionIndex[bolaoMatch.id] : null
            return (
              <MatchRow
                key={match.id}
                match={match}
                prediction={prediction}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function MatchRow({ match, prediction }) {
  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED'
  const bolao = match.bolao_match

  // Usa data/hora do bolão quando disponível, senão cai para utcDate da API externa
  const dateSource = bolao?.match_datetime ?? match.utcDate
  const date = new Date(dateSource)
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const getPointsColor = (pts) => {
    if (pts === 3) return 'text-green-400'
    if (pts === 1) return 'text-yellow-400'
    return 'text-gray-500'
  }

  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4 hover:bg-card-hover transition-colors">
      {/* Data — do bolão se disponível, senão da API externa */}
      <div className="text-xs text-gray-500 w-12 shrink-0 text-center">
        <div>{dateStr}</div>
        <div>{timeStr}</div>
        {bolao && <div className="text-gray-700 text-xs mt-0.5">🎯</div>}
      </div>

      {/* Times */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Casa */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span className="text-white font-medium truncate text-right text-sm">
            {match.homeTeam?.name ?? '—'}
          </span>
          {match.homeTeam?.crest && (
            <img src={match.homeTeam.crest} alt="" className="w-6 h-6 object-contain shrink-0" />
          )}
        </div>

        {/* Placar */}
        <div className="shrink-0 text-center w-20">
          {isFinished || isLive ? (
            <div className="flex items-center justify-center gap-1">
              <span className={`font-bold text-lg ${isLive ? 'text-green-400' : 'text-white'}`}>
                {match.score?.fullTime?.home ?? '—'}
              </span>
              <span className="text-gray-500">×</span>
              <span className={`font-bold text-lg ${isLive ? 'text-green-400' : 'text-white'}`}>
                {match.score?.fullTime?.away ?? '—'}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">vs</span>
          )}
          {isLive && (
            <div className="text-xs text-green-400 font-semibold animate-pulse">AO VIVO</div>
          )}
        </div>

        {/* Visitante */}
        <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
          {match.awayTeam?.crest && (
            <img src={match.awayTeam.crest} alt="" className="w-6 h-6 object-contain shrink-0" />
          )}
          <span className="text-white font-medium truncate text-sm">
            {match.awayTeam?.name ?? '—'}
          </span>
        </div>
      </div>

      {/* Palpite + fase */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {prediction && (
          <span className="text-xs text-gray-300 bg-background px-2 py-1 rounded-lg border border-border whitespace-nowrap">
            🎯 {prediction.home_score}×{prediction.away_score}
            {bolao?.is_finished && prediction.points != null && (
              <span className={`ml-1 font-bold ${getPointsColor(prediction.points)}`}>
                +{prediction.points}pts
              </span>
            )}
          </span>
        )}
        <span className="text-xs text-gray-700 hidden sm:block">
          {match.stage?.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  )
}

// ── Artilharia ────────────────────────────────────────────────────────────────

function ScorersTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getScorers()
      .then(setData)
      .catch(() => setError('Não foi possível carregar a artilharia. Tente novamente.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState text="Carregando artilharia..." />
  if (error) return <ErrorState message={error} />

  const scorers = data?.scorers ?? []

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="grid grid-cols-12 text-xs text-gray-500 uppercase tracking-wider px-4 py-3 border-b border-border">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-7">Jogador</div>
        <div className="col-span-2 text-center">Time</div>
        <div className="col-span-2 text-right">Gols</div>
      </div>

      {scorers.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Nenhum artilheiro registrado ainda.</div>
      ) : (
        scorers.map((entry, index) => (
          <div
            key={entry.player?.id ?? index}
            className="grid grid-cols-12 px-4 py-3 border-b border-border last:border-0 items-center hover:bg-card-hover transition-colors"
          >
            <div className="col-span-1 text-center text-gray-500 font-mono text-sm">
              {index + 1}
            </div>
            <div className="col-span-7 flex items-center gap-3">
              {entry.player?.photo ? (
                <img
                  src={entry.player.photo}
                  alt={entry.player.name}
                  className="w-8 h-8 rounded-full object-cover bg-gray-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-500 text-xs">
                  ⚽
                </div>
              )}
              <span className="text-white font-medium text-sm">{entry.player?.name ?? '—'}</span>
            </div>
            <div className="col-span-2 text-center">
              {entry.team?.crest ? (
                <img
                  src={entry.team.crest}
                  alt={entry.team.name}
                  className="w-6 h-6 object-contain mx-auto"
                  title={entry.team.name}
                />
              ) : (
                <span className="text-gray-500 text-xs">{entry.team?.name ?? '—'}</span>
              )}
            </div>
            <div className="col-span-2 text-right font-bold text-accent text-lg">
              {entry.goals ?? 0}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function LoadingState({ text }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400 animate-pulse">{text}</div>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="text-3xl mb-2">⚠️</div>
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function WorldCupPage() {
  const [activeTab, setActiveTab] = useState('groups')
  const { isAuthenticated } = useAuth()
  // Índice bolao_match_id → prediction (só monta se usuário estiver logado)
  const [predictionIndex, setPredictionIndex] = useState({})

  useEffect(() => {
    if (!isAuthenticated) return
    getPredictions()
      .then((preds) => {
        const index = {}
        preds.forEach((p) => { index[p.match] = p })
        setPredictionIndex(index)
      })
      .catch(() => {}) // silencioso
  }, [isAuthenticated])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          🌍 <span className="text-accent">Copa do Mundo 2026</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Classificação, resultados e artilharia em tempo real
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba */}
      {activeTab === 'groups' && <StandingsTab />}
      {activeTab === 'matches' && <MatchesTab predictionIndex={predictionIndex} />}
      {activeTab === 'scorers' && <ScorersTab />}
    </div>
  )
}
