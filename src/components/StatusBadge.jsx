import { toSentenceCase } from '../utils/format'

const statusClassMap = {
  PENDING: 'status-chip status-pending',
  CONFIRMED: 'status-chip status-confirmed',
  SHIPPED: 'status-chip status-shipped',
  DELIVERED: 'status-chip status-delivered',
  CANCELLED: 'status-chip status-cancelled',
  CREATED: 'status-chip status-created',
  IN_TRANSIT: 'status-chip status-transit',
}

export default function StatusBadge({ status }) {
  if (!status) {
    return <span className="status-chip">Unknown</span>
  }

  const className = statusClassMap[status] ?? 'status-chip'
  return <span className={className}>{toSentenceCase(status)}</span>
}
