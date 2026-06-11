import { useState, useEffect } from 'react'
import { getUsers, createUser, deleteUser } from '../api/users'
import { useAuth } from '../context/AuthContext'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', is_admin: false })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const { user: currentUser } = useAuth()

  const fetchUsers = async () => {
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    try {
      await createUser(form)
      setForm({ username: '', password: '', is_admin: false })
      setShowForm(false)
      fetchUsers()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.values(data).flat().join(' ')
        setFormError(msgs)
      } else {
        setFormError('Erro ao criar usuário.')
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id, username) => {
    if (username === currentUser?.username) {
      alert('Você não pode excluir sua própria conta.')
      return
    }
    if (!confirm(`Excluir o usuário "${username}"?`)) return
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      alert('Erro ao excluir usuário.')
    }
  }

  const inputClass =
    'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">👥 Gerenciar Usuários</h1>
          <p className="text-gray-400 text-sm mt-1">{users.length} usuários cadastrados</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent text-black font-bold px-4 py-2 rounded-xl hover:bg-yellow-400 transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Novo Usuário'}
        </button>
      </div>

      {/* Create user form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-bold text-white mb-4">Novo Usuário</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Usuário</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  className={inputClass}
                  placeholder="nome_usuario"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Senha</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_admin}
                onChange={(e) => setForm((p) => ({ ...p, is_admin: e.target.checked }))}
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm text-gray-300">Usuário administrador</span>
            </label>

            {formError && <p className="text-red-400 text-sm">{formError}</p>}

            <button
              type="submit"
              disabled={formLoading}
              className="bg-accent text-black font-bold px-6 py-2 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {formLoading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>
        </div>
      )}

      {/* Users list */}
      {loading ? (
        <div className="text-gray-400 animate-pulse text-center py-10">Carregando...</div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 text-xs text-gray-500 uppercase tracking-wider px-4 py-3 border-b border-border">
            <div className="col-span-1">#</div>
            <div className="col-span-7">Usuário</div>
            <div className="col-span-2">Tipo</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum usuário encontrado.</div>
          ) : (
            users.map((u, idx) => {
              const isMe = u.username === currentUser?.username
              return (
                <div
                  key={u.id}
                  className={`grid grid-cols-12 px-4 py-3 border-b border-border last:border-0 items-center ${
                    isMe ? 'bg-primary/10' : 'hover:bg-card-hover'
                  } transition-colors`}
                >
                  <div className="col-span-1 text-gray-500 text-sm">{idx + 1}</div>
                  <div className="col-span-7 flex items-center gap-2">
                    <span className="font-medium text-white">{u.username}</span>
                    {isMe && (
                      <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                        você
                      </span>
                    )}
                  </div>
                  <div className="col-span-2">
                    {u.is_admin ? (
                      <span className="text-xs bg-accent text-black font-bold px-1.5 py-0.5 rounded">
                        ADMIN
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Jogador</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    {!isMe && (
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
