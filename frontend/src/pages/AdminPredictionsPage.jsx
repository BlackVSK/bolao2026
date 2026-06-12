import { useState, useEffect } from 'react'
import { getAdminPredictions, upsertAdminPrediction } from '../api/predictions'
import { getMatches } from '../api/matches'
import { getUsers } from '../api/users'
import { flagUrl } from '../constants/countries'

function ScoreInput({ value, onChange }) {
  return (
    <input
      type="number"
      min="0"
      max="99"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-14 text-center text-lg font-bold bg-background border border-border rounded-lg py-1.5 text-white focus:outline-none focus:border-accent transition-colors"
    />
  )
}

function PredictionRow({ pred, match, onSave }) {
  const [editing, setEditing] = useState(false)
  const [home, setHome] = useState(pred?.home_score ?? '')
  const [away, setAway] = useState(pred?.away_score ?? '')
  const [saving, setSaving] = useState(false)

  const getPointsColor = (pts) => {
    if (pts === 3) return 'text-green-400'
    if (pts === 1) return 'text-yellow-400'
    return 'text-gray-500'
  }

  const handleSave = async () => {
    if (home === '' || away === '') return
    setSaving(true)
    try {
      await upsertAdminPrediction({
        user: pred.user_id,
        match: match.id,
        home_score: Number(home),
        away_score: Number(away),
      })
      onSave()
      setEditing(false)
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-card-hover transition-colors gap-4">
      <span className="text-white font-medium w-28 shrink-0">{pred.username}</span>

      <div className="flex items-center gap-2 flex-1 justify-center">
        {editing ? (
          <>
            <ScoreInput value={home} onChange={setHome} />
            <span className="text-gray-500">×</span>
            <ScoreInput value={away} onChange={setAway} />
          </>
        ) : pred ? (
          <span className="text-sm font-mono text-white">
            {pred.home_score} × {pred.away_score}
            {match.is_finished && (
              <span className={`ml-2 font-bold ${getPointsColor(pred.points)}`}>
                +{pred.points}pts
              </span>
            )}
          </span>
        ) : (
          <span className="text-gray-600 text-sm italic">sem palpite</span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-3 py-1 bg-accent text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {saving ? '...' : 'Salvar'}
            </button>
            <button
              onClick={() => { setEditing(false); setHome(pred?.home_score ?? ''); setAway(pred?.away_score ?? '') }}
              className="text-xs px-3 py-1 border border-border text-gray-400 rounded-lg hover:bg-card-hover"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs px-3 py-1 bg-primary text-accent border border-accent/30 rounded-lg hover:bg-green-800 transition-colors font-medium"
          >
            {pred ? 'Editar' : 'Adicionar'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminPredictionsPage() {
  const [matches, setMatches] = useState([])
  const [users, setUsers] = useState([])
  const [predictions, setPredictions] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([getMatches(), getUsers()]).then(([m, u]) => {
      setMatches(m)
      setUsers(u.filter((u) => !u.is_admin))
      if (m.length > 0) setSelectedMatch(m[0])
    })
  }, [])

  useEffect(() => {
    if (!selectedMatch) return
    setLoading(true)
    getAdminPredictions({ match: selectedMatch.id })
      .then(setPredictions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedMatch])

  const refetch = () => {
    if (!selectedMatch) return
    getAdminPredictions({ match: selectedMatch.id }).then(setPredictions)
  }

  // Para cada usuário, encontra o palpite existente (ou null)
  const rows = users.map((u) => {
    const pred = predictions.find((p) => p.user_id === u.id)
    return {
      user_id: u.id,
      username: u.username,
      home_score: pred?.home_score,
      away_score: pred?.away_score,
      points: pred?.points,
      id: pred?.id,
    }
  })

  const formatDate = (dt) =>
    new Date(dt).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🎯 Palpites por Jogo</h1>
        <p className="text-gray-400 text-sm mt-1">Visualize e edite palpites de todos os participantes</p>
      </div>

      {/* Seletor de jogo */}
      <div className="mb-6">
        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Selecionar jogo</label>
        <select
          value={selectedMatch?.id ?? ''}
          onChange={(e) => setSelectedMatch(matches.find((m) => m.id === Number(e.target.value)))}
          className="w-full sm:w-auto bg-card border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
        >
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.home_team} vs {m.away_team} — {formatDate(m.match_datetime)}
              {m.is_finished ? ` (${m.home_score}×${m.away_score})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Card do jogo selecionado */}
      {selectedMatch && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-2">
          {/* Header do jogo */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedMatch.home_flag && (
                <img src={flagUrl(selectedMatch.home_flag)} alt="" className="w-7 h-5 object-cover rounded" />
              )}
              <span className="font-bold text-white">{selectedMatch.home_team}</span>
              {selectedMatch.is_finished ? (
                <span className="text-accent font-bold text-lg px-2">
                  {selectedMatch.home_score} – {selectedMatch.away_score}
                </span>
              ) : (
                <span className="text-gray-500 px-2">vs</span>
              )}
              <span className="font-bold text-white">{selectedMatch.away_team}</span>
              {selectedMatch.away_flag && (
                <img src={flagUrl(selectedMatch.away_flag)} alt="" className="w-7 h-5 object-cover rounded" />
              )}
            </div>
            <span className="text-xs text-gray-500">{formatDate(selectedMatch.match_datetime)}</span>
          </div>

          {/* Lista de palpites */}
          {loading ? (
            <div className="py-8 text-center text-gray-400 animate-pulse">Carregando...</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Nenhum participante cadastrado.</div>
          ) : (
            rows.map((row) => (
              <PredictionRow
                key={row.user_id}
                pred={row}
                match={selectedMatch}
                onSave={refetch}
              />
            ))
          )}
        </div>
      )}

      <p className="text-xs text-gray-600 mt-3">
        {predictions.length} de {users.length} participantes palpitaram neste jogo
      </p>
    </div>
  )
}
