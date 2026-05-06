import { useState } from 'react'
import Pagination from '../../components/Pagination'
import { BATCH_JOB_TYPES } from '../../constants/roles'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage, normalizePage } from '../../utils/apiHelpers'

const PAGE_SIZE = 10

export default function AdminBatchPage() {
  const [jobType, setJobType] = useState(BATCH_JOB_TYPES[0])
  const [cron, setCron] = useState('0 0 1 * * ?')
  const [logsFilter, setLogsFilter] = useState('')
  const [logsPage, setLogsPage] = useState(() => normalizePage(null, 0, PAGE_SIZE))
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const fetchLogs = async (page = 0, selectedJobType = logsFilter) => {
    setError('')

    try {
      const payload = await slmsApi.listBatchLogs({
        page,
        size: PAGE_SIZE,
        jobType: selectedJobType || undefined,
      })
      setLogsPage(payload)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    }
  }

  const executeAction = async (actionName) => {
    setError('')
    setNotice('')

    try {
      if (actionName === 'schedule') {
        await slmsApi.scheduleBatchJob({ jobType, cron })
        setNotice(`Scheduled ${jobType}.`)
      }

      if (actionName === 'run') {
        await slmsApi.runBatchJob({ jobType })
        setNotice(`Manual run started for ${jobType}.`)
      }

      if (actionName === 'retry') {
        await slmsApi.retryBatchJob({ jobType })
        setNotice(`Retry requested for ${jobType}.`)
      }

      await fetchLogs(0, logsFilter)
    } catch (actionError) {
      setError(getErrorMessage(actionError))
    }
  }

  return (
    <section className="panel reveal">
      <p className="eyebrow">Admin Batch</p>
      <h2>Batch scheduling and logs</h2>
      <p className="muted">
        IMPORT_PRODUCT_DATA loads products from storage/imports/products.csv. GENERATE_DAILY_REPORTS creates
        yesterday’s sales and inventory reports (PDF + EXCEL). AGGREGATE_SALES_DATA stores daily sales totals.
      </p>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      <div className="inline-form-row">
        <label>
          Job type
          <select value={jobType} onChange={(event) => setJobType(event.target.value)}>
            {BATCH_JOB_TYPES.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Cron
          <input value={cron} onChange={(event) => setCron(event.target.value)} />
        </label>
      </div>

      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={() => executeAction('schedule')}>
          Schedule
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => executeAction('run')}>
          Run now
        </button>
        <button type="button" className="btn btn-danger" onClick={() => executeAction('retry')}>
          Retry failed
        </button>
      </div>

      <div className="sub-panel">
        <form
          className="inline-form-row"
          onSubmit={(event) => {
            event.preventDefault()
            fetchLogs(0, logsFilter)
          }}
        >
          <label>
            Filter logs by job type
            <input
              value={logsFilter}
              placeholder="optional"
              onChange={(event) => setLogsFilter(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Load logs
          </button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job type</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {logsPage.content.map((row, index) => (
                <tr key={`${row.jobType}-${index}`}>
                  <td>{row.jobType}</td>
                  <td>{row.status}</td>
                  <td>{row.message || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination pageData={logsPage} onPageChange={(page) => fetchLogs(page, logsFilter)} />
      </div>
    </section>
  )
}
