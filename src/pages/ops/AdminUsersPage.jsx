import { useEffect, useState } from 'react'
import Pagination from '../../components/Pagination'
import { ROLES } from '../../constants/roles'
import { useAuth } from '../../auth/AuthContext'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage, normalizePage } from '../../utils/apiHelpers'

const PAGE_SIZE = 10

function roleOptions() {
  return [ROLES.CUSTOMER, ROLES.STAFF, ROLES.ADMIN]
}

export default function AdminUsersPage() {
  const { session } = useAuth()
  const [pageData, setPageData] = useState(() => normalizePage(null, 0, PAGE_SIZE))
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    role: ROLES.CUSTOMER,
  })
  const [roleMap, setRoleMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const fetchUsers = async (page = 0) => {
    setLoading(true)
    setError('')

    try {
      const payload = await slmsApi.listUsers({ page, size: PAGE_SIZE })
      setPageData(payload)

      const nextRoleMap = {}
      payload.content.forEach((user) => {
        nextRoleMap[user.username] = user.role
      })
      setRoleMap(nextRoleMap)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(0)
  }, [])

  const createUser = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    try {
      await slmsApi.createUser(createForm)
      setCreateForm({ username: '', password: '', role: ROLES.CUSTOMER })
      setNotice('User created.')
      await fetchUsers(pageData.number)
    } catch (createError) {
      setError(getErrorMessage(createError))
    }
  }

  const updateUser = async (username, currentRole) => {
    setError('')
    setNotice('')

    try {
      const nextRole = roleMap[username]
      const payload = {}
      if (nextRole && nextRole !== currentRole) {
        payload.role = nextRole
      }

      if (!payload.role) {
        setError('No role changes to save.')
        return
      }

      await slmsApi.updateUser(username, payload)
      setNotice(`User ${username} updated.`)
      await fetchUsers(pageData.number)
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    }
  }

  const deleteUser = async (username) => {
    setError('')
    setNotice('')

    try {
      await slmsApi.deleteUser(username)
      setNotice(`User ${username} deleted.`)
      await fetchUsers(pageData.number)
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  return (
    <section className="panel reveal">
      <p className="eyebrow">Admin Users</p>
      <h2>User and role management</h2>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      <form className="inline-form-row" onSubmit={createUser}>
        <label>
          Username
          <input
            value={createForm.username}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, username: event.target.value }))}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={createForm.password}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </label>
        <label>
          Role
          <select
            value={createForm.role}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value }))}
          >
            {roleOptions().map((role) => (
              <option value={role} key={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary">
          Create user
        </button>
      </form>

      {loading ? (
        <p className="loading-panel">Loading users...</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.content.map((user) => {
                  const isAdminUser = user.role === ROLES.ADMIN
                  const nextRole = roleMap[user.username] || user.role
                  const canSave = !isAdminUser && nextRole !== user.role

                  return (
                    <tr key={user.username}>
                      <td>{user.username}</td>
                      <td>
                        <select
                          value={nextRole}
                          disabled={isAdminUser}
                          onChange={(event) =>
                            setRoleMap((prev) => ({
                              ...prev,
                              [user.username]: event.target.value,
                            }))
                          }
                        >
                          {roleOptions().map((role) => (
                            <option value={role} key={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="button-row compact">
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={!canSave}
                            onClick={() => updateUser(user.username, user.role)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            disabled={user.username === session.username}
                            onClick={() => deleteUser(user.username)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination pageData={pageData} onPageChange={fetchUsers} />
        </>
      )}
    </section>
  )
}
