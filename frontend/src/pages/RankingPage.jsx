import { useState, useEffect } from 'react'
import { getRanking } from '../api/predictions'
import { useAuth } from '../context/AuthContext'

const medals = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    getRanking()
      .then(setRanking)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 animate-pulse">Carregando ranking...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          🏆 <span className="text-accent">Ranking Geral</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">Classificação de todos os participantes</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 text-xs text-gray-500 uppercase tracking-wider px-4 py-3 border-b border-border">
          <div className="col-span-2 text-center">Pos</div>
          <div className="col-span-7">Jogador</div>
          <div className="col-span-3 text-right">Pontos</div>
        </div>

        {/* Rows */}
        {ranking.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Nenhum palpite registrado ainda.
          </div>
        ) : (
          ranking.map((entry, index) => {
            const isCurrentUser = entry.username === user?.username
            const position = index + 1
            const medal = medals[index] || null

            return (
              <div
                key={entry.user_id}
                className={`grid grid-cols-12 px-4 py-3 border-b border-border last:border-0 items-center transition-colors ${
                  isCurrentUser
                    ? 'bg-primary/20 border-l-2 border-l-accent'
                    : 'hover:bg-card-hover'
                }`}
              >
                {/* Position */}
                <div className="col-span-2 text-center">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-gray-500 font-mono text-sm">{position}</span>
                  )}
                </div>

                {/* Username */}
                <div className="col-span-7 flex items-center gap-2">
                  <span
                    className={`font-semibold ${
                      isCurrentUser ? 'text-accent' : 'text-white'
                    }`}
                  >
                    {entry.username}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded font-medium">
                      você
                    </span>
                  )}
                </div>

                {/* Points */}
                <div className="col-span-3 text-right">
                  <span
                    className={`font-bold text-lg ${
                      position === 1 ? 'text-accent' : isCurrentUser ? 'text-accent' : 'text-white'
                    }`}
                  >
                    {entry.total_points}
                  </span>
                  <span className="text-gray-500 text-xs ml-1">pts</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 text-xs text-gray-600 text-center space-x-4">
        <span>🟢 Placar exato = 3pts</span>
        <span>🟡 Vencedor/empate = 1pt</span>
        <span>⚫ Errou = 0pts</span>
      </div>
    </div>
  )
}
