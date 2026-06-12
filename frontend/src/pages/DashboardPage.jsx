import { useState, useEffect } from 'react'
import { getMatches } from '../api/matches'
import { getPredictions } from '../api/predictions'
import { getEnrichedMatches } from '../api/worldCup'
import MatchCard from '../components/MatchCard'
import PredictionModal from '../components/PredictionModal'

function toLocalDateKey(isoString) {
  // Retorna 'YYYY-MM-DD' no fuso local do usuário
  const d = new Date(isoString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateLabel(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  // Constrói a data sem conversão de fuso
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function groupByDateKey(matches) {
  const groups = {}
  matches.forEach((match) => {
    const key = toLocalDateKey(match.match_datetime)
    if (!groups[key]) groups[key] = []
    groups[key].push(match)
  })
  return groups
}

export default function DashboardPage() {
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState([])
  const [liveIndex, setLiveIndex] = useState({})
  const [loading, setLoading] = useState(true)
  const [showPast, setShowPast] = useState(false)
  const [modalData, setModalData] = useState(null)

  const today = todayKey()

  const fetchData = async () => {
    try {
      const [matchesData, predsData] = await Promise.all([getMatches(), getPredictions()])
      setMatches(matchesData)
      setPredictions(predsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLiveData = async () => {
    try {
      const enriched = await getEnrichedMatches()
      if (!Array.isArray(enriched)) return
      const index = {}
      enriched.forEach((ext) => {
        const bm = ext.bolao_match
        if (!bm) return
        index[bm.id] = {
          live_status: ext.status,
          live_home_score: ext.score?.fullTime?.home ?? null,
          live_away_score: ext.score?.fullTime?.away ?? null,
        }
      })
      setLiveIndex(index)
    } catch {
      // silencioso — complementar
    }
  }

  useEffect(() => {
    fetchData()
    fetchLiveData()
    const interval = setInterval(fetchLiveData, 120_000)
    return () => clearInterval(interval)
  }, [])

  const getPredictionForMatch = (matchId) =>
    predictions.find((p) => p.match === matchId) || null

  const handlePredict = (match, prediction) => {
    setModalData({ match, prediction })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-lg animate-pulse">Carregando partidas...</div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🏟️</div>
        <p className="text-gray-400">Nenhuma partida sincronizada ainda.</p>
      </div>
    )
  }

  // Separa passados (antes de hoje), hoje, e futuros (após hoje)
  const pastMatches = matches.filter((m) => toLocalDateKey(m.match_datetime) < today)
  const todayMatches = matches.filter((m) => toLocalDateKey(m.match_datetime) === today)
  const futureMatches = matches.filter((m) => toLocalDateKey(m.match_datetime) > today)

  // Agrupa passados e futuros por data
  const pastGrouped = groupByDateKey(pastMatches)
  const futureGrouped = groupByDateKey(futureMatches)

  const renderGroup = (dateKey, dayMatches) => (
    <div key={dateKey}>
      <h2 className="text-sm font-semibold text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="h-px flex-1 bg-border" />
        <span>{formatDateLabel(dateKey)}</span>
        <span className="h-px flex-1 bg-border" />
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dayMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={getPredictionForMatch(match.id)}
            onPredict={handlePredict}
            liveData={liveIndex[match.id] ?? null}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">
            🏆 <span className="text-accent">Copa do Mundo 2026</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Faça seus palpites antes do início de cada partida
          </p>
        </div>

        {pastMatches.length > 0 && (
          <button
            onClick={() => setShowPast((v) => !v)}
            className={`text-sm px-4 py-2 rounded-xl border font-medium transition-colors ${
              showPast
                ? 'bg-primary text-accent border-accent/30'
                : 'text-gray-400 border-border hover:text-white hover:bg-card-hover'
            }`}
          >
            {showPast ? '▲ Ocultar anteriores' : `▼ Jogos anteriores (${pastMatches.length})`}
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* Jogos anteriores — colapsáveis */}
        {showPast && Object.keys(pastGrouped).sort().map((dateKey) =>
          renderGroup(dateKey, pastGrouped[dateKey])
        )}

        {/* Hoje — destaque */}
        {todayMatches.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-border" />
              <span className="text-white bg-accent/20 border border-accent/30 px-3 py-0.5 rounded-full text-accent">
                🗓️ Hoje
              </span>
              <span className="h-px flex-1 bg-border" />
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {todayMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={getPredictionForMatch(match.id)}
                  onPredict={handlePredict}
                  liveData={liveIndex[match.id] ?? null}
                />
              ))}
            </div>
          </div>
        )}

        {/* Jogos futuros agrupados por data */}
        {Object.keys(futureGrouped).sort().map((dateKey) =>
          renderGroup(dateKey, futureGrouped[dateKey])
        )}

        {/* Se não há jogos hoje nem futuros */}
        {todayMatches.length === 0 && futureMatches.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Não há jogos agendados. Use o botão acima para ver jogos anteriores.
          </div>
        )}
      </div>

      {modalData && (
        <PredictionModal
          match={modalData.match}
          existingPrediction={modalData.prediction}
          onClose={() => setModalData(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}
