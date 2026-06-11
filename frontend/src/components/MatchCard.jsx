import { useState, useEffect } from 'react'

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isPast, setIsPast] = useState(false)

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) {
        setIsPast(true)
        setTimeLeft('Encerrado')
        return
      }
      setIsPast(false)
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      else setTimeLeft(`${minutes}m ${seconds}s`)
    }

    calculate()
    const timer = setInterval(calculate, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return { timeLeft, isPast }
}

export default function MatchCard({ match, prediction, onPredict }) {
  const { timeLeft, isPast } = useCountdown(match.match_datetime)

  const formatDate = (dt) => {
    return new Date(dt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPointsColor = (pts) => {
    if (pts === 3) return 'text-green-400'
    if (pts === 1) return 'text-yellow-400'
    return 'text-gray-500'
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 hover:border-accent/30 transition-all">
      {/* Teams row */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex-1 text-center">
          <div className="text-3xl mb-1">{match.home_flag}</div>
          <div className="text-sm font-semibold text-white leading-tight">{match.home_team}</div>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center px-3">
          {match.is_finished ? (
            <div className="text-2xl font-bold text-accent">
              {match.home_score} – {match.away_score}
            </div>
          ) : (
            <div className="text-gray-500 font-bold text-lg">VS</div>
          )}
          <div className={`text-xs mt-1 ${isPast ? 'text-red-400' : 'text-green-400'}`}>
            {match.is_finished ? '✓ Finalizada' : timeLeft}
          </div>
        </div>

        {/* Away team */}
        <div className="flex-1 text-center">
          <div className="text-3xl mb-1">{match.away_flag}</div>
          <div className="text-sm font-semibold text-white leading-tight">{match.away_team}</div>
        </div>
      </div>

      {/* Date + prediction row */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500">{formatDate(match.match_datetime)}</span>

        <div className="flex items-center gap-2">
          {/* Existing prediction badge */}
          {prediction && (
            <span className="text-xs text-gray-300 bg-background px-2 py-1 rounded-lg border border-border">
              Palpite:{' '}
              <span className="font-bold text-white">
                {prediction.home_score}×{prediction.away_score}
              </span>
              {match.is_finished && (
                <span className={`ml-1 font-bold ${getPointsColor(prediction.points)}`}>
                  +{prediction.points}pts
                </span>
              )}
            </span>
          )}

          {/* Action button */}
          {!match.is_finished && (
            <button
              onClick={() => onPredict(match, prediction)}
              disabled={isPast}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                isPast
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : prediction
                  ? 'bg-primary text-accent border border-accent/30 hover:bg-green-800'
                  : 'bg-accent text-black hover:bg-yellow-400'
              }`}
            >
              {isPast ? 'Encerrado' : prediction ? 'Editar' : 'Palpitar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
