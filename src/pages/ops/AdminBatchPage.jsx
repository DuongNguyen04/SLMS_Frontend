import { useState } from 'react'
import Pagination from '../../components/Pagination'
import { BATCH_JOB_TYPES } from '../../constants/roles'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage, normalizePage } from '../../utils/apiHelpers'
import { formatCurrency } from '../../utils/format'

const PAGE_SIZE = 10
const PRODUCT_TEMPLATE_URL = '/templates/products-sample.csv'
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const toDateInputValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const DEFAULT_REPORT_DATE = toDateInputValue(new Date(Date.now() - ONE_DAY_MS))
const ACTIONS = [
  {
    id: 'schedule',
    label: 'Set automatic schedule',
    help: 'Use this when you want the task to run on a fixed schedule.',
  },
  {
    id: 'run',
    label: 'Run once now',
    help: 'Use this to run the task immediately one time.',
  },
  {
    id: 'retry',
    label: 'Run again after failure',
    help: 'Use this only if the last run failed and you want to try again.',
  },
]

const JOB_META = {
  IMPORT_PRODUCT_DATA: {
    label: 'Import products from file',
    description: 'Adds new products or updates existing ones from the import file.',
    requirements:
      'Needs the products file: storage/imports/products.csv (columns: name, price, stock_quantity or stockQuantity, optional image_url or imageUrl).',
  },
  GENERATE_DAILY_REPORTS: {
    label: 'Create reports for a date',
    description: 'Creates sales and inventory reports for the selected day (PDF and Excel).',
    requirements: 'Needs orders and products for the selected day.',
  },
  AGGREGATE_SALES_DATA: {
    label: 'Summarize sales for a date',
    description: 'Totals confirmed, shipped, and delivered orders for the selected day.',
    requirements: 'Needs orders for the selected day.',
  },
}

const SCHEDULE_PRESETS = [
  { id: 'DAILY_01', label: 'Every day at 01:00 (recommended)', cron: '0 0 1 * * ?' },
  { id: 'DAILY_23', label: 'Every day at 23:00', cron: '0 0 23 * * ?' },
  { id: 'WEEKLY_MON_01', label: 'Every Monday at 01:00', cron: '0 0 1 ? * MON' },
]

export default function AdminBatchPage() {
  const [jobType, setJobType] = useState(BATCH_JOB_TYPES[0])
  const [schedulePreset, setSchedulePreset] = useState(SCHEDULE_PRESETS[0].id)
  const [actionMode, setActionMode] = useState('')
  const [showLogs, setShowLogs] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [runResult, setRunResult] = useState(null)
  const [reportDate, setReportDate] = useState(DEFAULT_REPORT_DATE)
  const [logsFilter, setLogsFilter] = useState('')
  const [logsPage, setLogsPage] = useState(() => normalizePage(null, 0, PAGE_SIZE))
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const selectedJob = JOB_META[jobType] ?? {
    label: jobType,
    description: '',
    requirements: '',
  }
  const isReportJob = jobType === 'GENERATE_DAILY_REPORTS'
  const isAggregateJob = jobType === 'AGGREGATE_SALES_DATA'

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

  const executeAction = async (actionName, payload = {}) => {
    setError('')
    setNotice('')

    try {
      if (actionName === 'schedule') {
        const selectedPreset = SCHEDULE_PRESETS.find((item) => item.id === schedulePreset)
        const cronValue = selectedPreset?.cron
        if (!cronValue) {
          setError('Please choose a schedule.')
          return
        }

        await slmsApi.scheduleBatchJob({ jobType, cron: cronValue })
        setRunResult(null)
        setNotice(`Automatic schedule saved for ${selectedJob.label}.`)
      }

      if (actionName === 'run') {
        const response = await slmsApi.runBatchJob({ jobType, ...payload })
        setRunResult(response)
        if (response?.status === 'FAILED') {
          setError(response.message || 'Unexpected error. Please try again.')
        } else {
          setNotice(response?.message || `Running ${selectedJob.label} now.`)
        }
      }

      if (actionName === 'retry') {
        const response = await slmsApi.retryBatchJob({ jobType })
        setRunResult(response)
        if (response?.status === 'FAILED') {
          setError(response.message || 'Unexpected error. Please try again.')
        } else {
          setNotice(response?.message || `Running ${selectedJob.label} again after failure.`)
        }
      }

      await fetchLogs(0, logsFilter)
      setShowLogs(true)
    } catch (actionError) {
      setError(getErrorMessage(actionError))
    }
  }

  const handleImportUpload = async () => {
    if (!importFile) {
      setError('Please choose a CSV file to upload.')
      return
    }

    setError('')
    setNotice('')
    setIsUploading(true)

    try {
      const response = await slmsApi.uploadImportProducts(importFile)
      setRunResult(response)
      if (response?.status === 'FAILED') {
        setError(response.message || 'Unexpected error. Please try again.')
      } else {
        setNotice(response?.message || 'File uploaded and import started.')
      }
      setImportFile(null)
      await fetchLogs(0, logsFilter)
      setShowLogs(true)
    } catch (uploadError) {
      setError(getErrorMessage(uploadError))
    } finally {
      setIsUploading(false)
    }
  }

  const downloadReport = async (report) => {
    if (!report?.fileName) {
      return
    }

    setError('')
    try {
      const blob = await slmsApi.downloadReport(report.fileName)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = report.fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (downloadError) {
      setError(getErrorMessage(downloadError))
    }
  }

  return (
    <section className="panel reveal">
      <p className="eyebrow">Admin Batch</p>
      <h2>Automated admin tasks</h2>
      <p className="muted">
        Choose a task, decide when it should run, then start it. You can also run it once any time.
      </p>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      <div className="sub-panel">
        <h3>Task details</h3>
        <p className="muted">
          <strong>{selectedJob.label}.</strong> {selectedJob.description}
        </p>
        {selectedJob.requirements && <p className="muted">Before you run: {selectedJob.requirements}</p>}
        {jobType === 'IMPORT_PRODUCT_DATA' && (
          <div className="button-row">
            <a className="btn btn-ghost" href={PRODUCT_TEMPLATE_URL} download>
              Download sample import file
            </a>
          </div>
        )}
      </div>

      <div className="inline-form-row">
        <label>
          Task
          <select
            value={jobType}
            onChange={(event) => {
              setJobType(event.target.value)
              setActionMode('')
              setImportFile(null)
              setReportDate(DEFAULT_REPORT_DATE)
              setRunResult(null)
            }}
          >
            {BATCH_JOB_TYPES.map((item) => (
              <option value={item} key={item}>
                {JOB_META[item]?.label ?? item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="sub-panel">
        <h3>What do you want to do?</h3>
        <div className="button-row">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className={`btn ${actionMode === action.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setActionMode(action.id)
                setRunResult(null)
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
        <p className="muted">
          {actionMode
            ? ACTIONS.find((action) => action.id === actionMode)?.help
            : 'Choose one action to continue.'}
        </p>
      </div>

      {actionMode === 'schedule' && (
        <div className="sub-panel">
          <h3>Choose a schedule</h3>
          <div className="inline-form-row">
            <label>
              When should it run?
              <select value={schedulePreset} onChange={(event) => setSchedulePreset(event.target.value)}>
                {SCHEDULE_PRESETS.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => executeAction('schedule')}>
            Save schedule
          </button>
        </div>
      )}

      {actionMode === 'run' && (
        <div className="sub-panel">
          <h3>Run once</h3>
          {jobType === 'IMPORT_PRODUCT_DATA' ? (
            <>
              <p className="muted">Upload a CSV file and run the import immediately.</p>
              <div className="inline-form-row">
                <label>
                  Choose CSV file
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImportUpload}
                  disabled={!importFile || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload and run now'}
                </button>
              </div>
            </>
          ) : isReportJob || isAggregateJob ? (
            <>
              <p className="muted">
                {isReportJob
                  ? 'Pick a date to generate sales and inventory reports.'
                  : 'Pick a date to update the sales summary.'}
              </p>
              <div className="inline-form-row">
                <label>
                  Date
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(event) => setReportDate(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => executeAction('run', { reportDate })}
                  disabled={!reportDate}
                >
                  {isReportJob ? 'Generate reports' : 'Update summary'}
                </button>
              </div>
              {isReportJob && <p className="muted">Generated files will appear below after completion.</p>}
              {isAggregateJob && (
                <p className="muted">This updates sales summary data only; no file will be created.</p>
              )}
            </>
          ) : (
            <>
              <p className="muted">This will start immediately and run once.</p>
              <button type="button" className="btn btn-primary" onClick={() => executeAction('run')}>
                Run now
              </button>
            </>
          )}
        </div>
      )}

      {actionMode === 'run' && runResult?.jobType === jobType && (
        <div className="sub-panel">
          <h3>Latest result</h3>
          <p className="muted">Status: {runResult.status || '-'}</p>
          {runResult.message && <p className="muted">{runResult.message}</p>}

          {Array.isArray(runResult.reports) && runResult.reports.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Format</th>
                    <th>File</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {runResult.reports.map((report, index) => (
                    <tr key={`${report.fileName}-${index}`}>
                      <td>{report.reportType}</td>
                      <td>{report.exportFormat}</td>
                      <td>{report.fileName}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => downloadReport(report)}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {runResult.summary && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Total revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{runResult.summary.reportDate || '-'}</td>
                    <td>{runResult.summary.orderCount ?? '-'}</td>
                    <td>{formatCurrency(runResult.summary.totalRevenue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {actionMode === 'retry' && (
        <div className="sub-panel">
          <h3>Run again after failure</h3>
          <p className="muted">Only use this if the last run failed and you have fixed the issue.</p>
          <button type="button" className="btn btn-danger" onClick={() => executeAction('retry')}>
            Run again
          </button>
        </div>
      )}

      <div className="sub-panel">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            const next = !showLogs
            setShowLogs(next)
            if (next) {
              fetchLogs(0, logsFilter)
            }
          }}
        >
          {showLogs ? 'Hide logs' : 'Show logs'}
        </button>

        {showLogs && (
          <>
            <form
              className="inline-form-row"
              onSubmit={(event) => {
                event.preventDefault()
                fetchLogs(0, logsFilter)
              }}
            >
              <label>
                Show logs for
                <select value={logsFilter} onChange={(event) => setLogsFilter(event.target.value)}>
                  <option value="">All tasks</option>
                  {BATCH_JOB_TYPES.map((item) => (
                    <option value={item} key={item}>
                      {JOB_META[item]?.label ?? item}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn btn-primary">
                Refresh logs
              </button>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Result</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logsPage.content.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="muted">
                        No logs yet.
                      </td>
                    </tr>
                  ) : (
                    logsPage.content.map((row, index) => (
                      <tr key={`${row.jobType}-${index}`}>
                        <td>{JOB_META[row.jobType]?.label ?? row.jobType}</td>
                        <td>{row.status}</td>
                        <td>{row.message || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination pageData={logsPage} onPageChange={(page) => fetchLogs(page, logsFilter)} />
          </>
        )}
      </div>
    </section>
  )
}
