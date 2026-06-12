import { useState, useEffect } from 'react'
import { getMatches } from '../api/matches'
import { triggerSync } from '../api/worldCup'
import { flagUrl } from '../constants/countries'

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  const fetchMatches = async () => {
    try {
      const data = await getMatches()
      setMatches(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await triggerSync()
      setSyncResult({ ok: true, stats: result.stats })
      await fetchMatches()
    } catch (err) {
      setSyncResult({ ok: false, message: err.response?.data?.detail || 'Erro ao sincronizar.' })
    } finally {
      setSyncing(false)
    }
  }

  const formatDate = (dt) =>
    new Date(dt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">⚙️ Partidas da Copa</h1>
          <p className="text-gray-400 text-sm mt-1">
            {matches.length} partidas sincronizadas · atualizado automaticamente a cada hora
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-accent text-black font-bold px-4 py-2 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {syncing ? (
            <>
              <span className="animate-spin">⟳</span> Sincronizando...
            </>
          ) : (
            '⟳ Sincronizar agora'
          )}
        </button>
      </div>

      {/* Resultado da última sync manual */}
      {syncResult && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl border text-sm ${
            syncResult.ok
              ? 'bg-green-900/20 border-green-700/40 text-green-400'
              : 'bg-red-900/20 border-red-700/40 text-red-400'
          }`}
        >
          {syncResult.ok ? (
            <>
              ✓ Sync concluída —{' '}
              <span className="font-mono">
                {syncResult.stats.created} criados · {syncResult.stats.updated} atualizados ·{' '}
                {syncResult.stats.finished} finalizados · {syncResult.stats.skipped} ignorados
                {syncResult.stats.errors > 0 && ` · ${syncResult.stats.errors} erros`}
              </span>
            </>
          ) : (
            `✗ ${syncResult.message}`
          )}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 animate-pulse text-center py-10">Carregando...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🏟️</div>
          <p className="text-gray-400 mb-4">Nenhuma partida sincronizada ainda.</p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-accent text-black font-bold px-4 py-2 rounded-xl hover:bg-yellow-400 transition-colors"
          >
            Sincronizar da API
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {match.home_flag && (
                  <img
                    src={flagUrl(match.home_flag)}
                    alt={match.home_team}
                    className="w-7 h-5 object-cover rounded"
                  />
                )}
                <span className="text-sm font-semibold text-white whitespace-nowrap">
                  {match.home_team}
                </span>
                <span className="text-gray-500 text-xs">vs</span>
                <span className="text-sm font-semibold text-white whitespace-nowrap">
                  {match.away_team}
                </span>
                {match.away_flag && (
                  <img
                    src={flagUrl(match.away_flag)}
                    alt={match.away_team}
                    className="w-7 h-5 object-cover rounded"
                  />
                )}

                {match.is_finished ? (
                  <span className="text-xs bg-green-900/40 text-green-400 border border-green-700/40 px-2 py-0.5 rounded-full">
                    {match.home_score}×{match.away_score} ✓
                  </span>
                ) : (
                  <span className="text-xs bg-blue-900/20 text-blue-400 border border-blue-700/30 px-2 py-0.5 rounded-full">
                    Agendado
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-500 shrink-0 hidden sm:block">
                {formatDate(match.match_datetime)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
