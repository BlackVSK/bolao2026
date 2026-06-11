import { useState, useEffect } from 'react'
import { getMatches } from '../api/matches'
import { getPredictions } from '../api/predictions'
import MatchCard from '../components/MatchCard'
import PredictionModal from '../components/PredictionModal'

function groupByDate(matches) {
  const groups = {}
  matches.forEach((match) => {
    const date = new Date(match.match_datetime).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(match)
  })
  return groups
}

export default function DashboardPage() {
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalData, setModalData] = useState(null) // { match, prediction }

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

  useEffect(() => {
    fetchData()
  }, [])

  const getPredictionForMatch = (matchId) =>
    predictions.find((p) => p.match === matchId) || null

  const handlePredict = (match, prediction) => {
    setModalData({ match, prediction })
  }

  const grouped = groupByDate(matches)

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
        <p className="text-gray-400">Nenhuma partida cadastrada ainda.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          🏆 <span className="text-accent">Copa do Mundo 2026</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Faça seus palpites antes do início de cada partida
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([date, dayMatches]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-border" />
              <span>{date}</span>
              <span className="h-px flex-1 bg-border" />
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dayMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={getPredictionForMatch(match.id)}
                  onPredict={handlePredict}
                />
              ))}
            </div>
          </div>
        ))}
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
