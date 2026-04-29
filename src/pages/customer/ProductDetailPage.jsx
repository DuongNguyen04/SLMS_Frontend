import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage } from '../../utils/apiHelpers'
import { formatCurrency } from '../../utils/format'

export default function ProductDetailPage() {
  const { productName } = useParams()
  const decodedName = decodeURIComponent(productName)

  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true)
      setError('')

      try {
        const payload = await slmsApi.getProductByName(decodedName)
        setProduct(payload)
      } catch (loadError) {
        setError(getErrorMessage(loadError))
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [decodedName])

  const onAdd = async () => {
    setNotice('')
    setError('')
    setIsAdding(true)

    try {
      await slmsApi.addCartItem({
        productName: decodedName,
        quantity: Number(quantity),
      })
      setNotice(`Added ${quantity} item(s) to cart.`)
    } catch (addError) {
      setError(getErrorMessage(addError))
    } finally {
      setIsAdding(false)
    }
  }

  if (loading) {
    return <div className="panel loading-panel">Loading product...</div>
  }

  if (!product) {
    return (
      <div className="panel empty-panel">
        <h3>Product unavailable</h3>
        <p>{error || 'The selected product was not found.'}</p>
        <Link className="btn btn-ghost" to="/shop/products">
          Back to catalog
        </Link>
      </div>
    )
  }

  return (
    <section className="panel detail-panel reveal">
      <div className="detail-media-wrap">
        <img
          className="detail-product-image"
          src={product.imageUrl || 'https://picsum.photos/seed/slms-product-detail-fallback/1200/800'}
          alt={`Illustration for ${product.name}`}
        />
      </div>
      <p className="eyebrow">Product Detail</p>
      <h2>{product.name}</h2>
      <p className="detail-price">{formatCurrency(product.price)}</p>
      <p className="muted">Available stock: {product.stockQuantity}</p>

      <div className="inline-form-row">
        <label>
          Quantity
          <input
            type="number"
            min="1"
            max={product.stockQuantity || 1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAdd}
          disabled={isAdding || product.stockQuantity <= 0}
        >
          {isAdding ? 'Adding...' : 'Add to cart'}
        </button>
      </div>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      <Link className="btn btn-ghost" to="/shop/products">
        Back to catalog
      </Link>
    </section>
  )
}
