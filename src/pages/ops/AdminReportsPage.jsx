import { useState } from 'react'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage } from '../../utils/apiHelpers'

export default function AdminReportsPage() {
  const [formState, setFormState] = useState({
    startDate: '',
    endDate: '',
    format: 'PDF',
  })
  const [salesReport, setSalesReport] = useState(null)
  const [inventoryReport, setInventoryReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async (reportType) => {
    setError('')
    setLoading(true)

    try {
      const payload =
        reportType === 'sales'
          ? await slmsApi.generateSalesReport(formState)
          : await slmsApi.generateInventoryReport(formState)

      if (reportType === 'sales') {
        setSalesReport(payload)
      } else {
        setInventoryReport(payload)
      }
    } catch (generateError) {
      setError(getErrorMessage(generateError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel reveal">
      <p className="eyebrow">Admin Reports</p>
      <h2>Sales and inventory reports</h2>

      <div className="inline-form-row">
        <label>
          Start date
          <input
            type="date"
            value={formState.startDate}
            onChange={(event) => setFormState((prev) => ({ ...prev, startDate: event.target.value }))}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={formState.endDate}
            onChange={(event) => setFormState((prev) => ({ ...prev, endDate: event.target.value }))}
          />
        </label>
        <label>
          Format
          <select
            value={formState.format}
            onChange={(event) => setFormState((prev) => ({ ...prev, format: event.target.value }))}
          >
            <option value="PDF">PDF</option>
            <option value="EXCEL">EXCEL</option>
          </select>
        </label>
      </div>

      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={() => generate('sales')} disabled={loading}>
          Generate sales
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => generate('inventory')}
          disabled={loading}
        >
          Generate inventory
        </button>
      </div>

      {error && <p className="inline-error">{error}</p>}

      <div className="reports-grid">
        <article className="sub-panel">
          <h3>Sales report response</h3>
          {salesReport ? (
            <>
              <p>Type: {salesReport.reportType}</p>
              <p>Format: {salesReport.format}</p>
              <p>Download URL: {salesReport.downloadUrl}</p>
            </>
          ) : (
            <p className="muted">No sales report generated yet.</p>
          )}
        </article>

        <article className="sub-panel">
          <h3>Inventory report response</h3>
          {inventoryReport ? (
            <>
              <p>Type: {inventoryReport.reportType}</p>
              <p>Format: {inventoryReport.format}</p>
              <p>Download URL: {inventoryReport.downloadUrl}</p>
            </>
          ) : (
            <p className="muted">No inventory report generated yet.</p>
          )}
        </article>
      </div>
    </section>
  )
}
