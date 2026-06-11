import { useState, useEffect } from 'react'
import { getMatches, deleteMatch } from '../api/matches'
import MatchFormModal from '../components/MatchFormModal'

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMatch, setEditingMatch] = useState(null)

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

  const handleEdit = (match) => {
    setEditingMatch(match)
    setShowModal(true)
  }

  const handleNew = () => {
    setEditingMatch(null)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Confirmar exclusão desta partida?')) return
    try {
      await deleteMatch(id)
      setMatches((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      alert('Erro ao excluir partida.')
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
          <h1 className="text-2xl font-bold text-white">⚙️ Gerenciar Partidas</h1>
          <p className="text-gray-400 text-sm mt-1">{matches.length} partidas cadastradas</p>
        </div>
        <button
          onClick={handleNew}
          className="bg-accent text-black font-bold px-4 py-2 rounded-xl hover:bg-yellow-400 transition-colors"
        >
          + Nova Partida
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 animate-pulse text-center py-10">
          Carregando...
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🏟️</div>
          <p className="text-gray-400">Nenhuma partida cadastrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xl">{match.home_flag}</span>
                <span className="text-sm font-semibold text-white whitespace-nowrap">
                  {match.home_team}
                </span>
                <span className="text-gray-500 text-xs">vs</span>
                <span className="text-sm font-semibold text-white whitespace-nowrap">
                  {match.away_team}
                </span>
                <span className="text-xl">{match.away_flag}</span>

                {match.is_finished && (
                  <span className="text-xs bg-green-900/40 text-green-400 border border-green-700/40 px-2 py-0.5 rounded-full">
                    {match.home_score}×{match.away_score} ✓
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500 hidden sm:block">
                  {formatDate(match.match_datetime)}
                </span>
                <button
                  onClick={() => handleEdit(match)}
                  className="text-xs px-3 py-1.5 bg-primary text-accent rounded-lg hover:bg-green-800 transition-colors font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(match.id)}
                  className="text-xs px-3 py-1.5 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors font-medium border border-red-800/30"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <MatchFormModal
          existingMatch={editingMatch}
          onClose={() => setShowModal(false)}
          onSaved={fetchMatches}
        />
      )}
    </div>
  )
}
