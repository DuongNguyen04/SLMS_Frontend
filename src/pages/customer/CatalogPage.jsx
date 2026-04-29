import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage, normalizePage } from '../../utils/apiHelpers'
import { formatCurrency } from '../../utils/format'

const PAGE_SIZE = 8

export default function CatalogPage() {
  const [filters, setFilters] = useState({ keyword: '', minPrice: '', maxPrice: '' })
  const [submittedFilters, setSubmittedFilters] = useState({
    keyword: '',
    minPrice: '',
    maxPrice: '',
  })
  const [pageData, setPageData] = useState(() => normalizePage(null, 0, PAGE_SIZE))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyProductName, setBusyProductName] = useState('')

  const fetchProducts = async ({ page, activeFilters }) => {
    setLoading(true)
    setError('')

    try {
      const response = await slmsApi.listProducts({
        page,
        size: PAGE_SIZE,
        keyword: activeFilters.keyword,
        minPrice: activeFilters.minPrice,
        maxPrice: activeFilters.maxPrice,
      })
      setPageData(response)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts({ page: 0, activeFilters: submittedFilters })
  }, [submittedFilters])

  const hasProducts = pageData.content.length > 0

  const productCountLabel = useMemo(() => {
    if (pageData.totalElements === 0) {
      return 'No items in this view'
    }

    return `Showing up to ${PAGE_SIZE} products per page (${pageData.totalElements} total)`
  }, [pageData.totalElements])

  const applyFilters = (event) => {
    event.preventDefault()
    setSubmittedFilters(filters)
  }

  const clearFilters = () => {
    const reset = { keyword: '', minPrice: '', maxPrice: '' }
    setFilters(reset)
    setSubmittedFilters(reset)
  }

  const onAddToCart = async (productName) => {
    setNotice('')
    setBusyProductName(productName)

    try {
      await slmsApi.addCartItem({ productName, quantity: 1 })
      setNotice(`Added ${productName} to cart.`)
    } catch (addError) {
      setError(getErrorMessage(addError))
    } finally {
      setBusyProductName('')
    }
  }

  return (
    <section className="reveal">
      <div className="panel product-hero">
        <div>
          <p className="eyebrow">Customer Storefront</p>
          <h2>Discover products built for smooth fulfillment</h2>
          <p className="muted">{productCountLabel}</p>
        </div>
        <form className="catalog-filter-bar" onSubmit={applyFilters}>
          <div className="catalog-filter-top">
            <label className="search-input-wrap">
              Search products
              <input
                placeholder="Try: mouse, monitor, headphones..."
                value={filters.keyword}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, keyword: event.target.value }))
                }
              />
            </label>

            <div className="button-row">
              <button type="submit" className="btn btn-primary">
                Apply
              </button>
              <button type="button" className="btn btn-ghost" onClick={clearFilters}>
                Reset
              </button>
            </div>
          </div>

          <div className="catalog-filter-fields">
            <label>
              Min price
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.minPrice}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, minPrice: event.target.value }))
                }
              />
            </label>
            <label>
              Max price
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.maxPrice}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, maxPrice: event.target.value }))
                }
              />
            </label>
          </div>
        </form>
      </div>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      {loading ? (
        <div className="panel loading-panel">Loading products...</div>
      ) : (
        <>
          {hasProducts ? (
            <div className="catalog-grid stagger-in">
              {pageData.content.map((product) => (
                <article className="product-card" key={product.name}>
                  <div className="product-media-wrap">
                    <img
                      className="product-thumb"
                      src={product.imageUrl || 'https://picsum.photos/seed/slms-product-fallback/800/560'}
                      alt={`Illustration for ${product.name}`}
                      loading="lazy"
                    />
                  </div>
                  <p className="product-stock">Stock: {product.stockQuantity}</p>
                  <h3>{product.name}</h3>
                  <p className="product-price">{formatCurrency(product.price)}</p>
                  <div className="card-actions">
                    <Link className="btn btn-ghost" to={`/shop/products/${encodeURIComponent(product.name)}`}>
                      Details
                    </Link>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => onAddToCart(product.name)}
                      disabled={product.stockQuantity <= 0 || busyProductName === product.name}
                    >
                      {busyProductName === product.name ? 'Adding...' : 'Add to cart'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel empty-panel">
              <h3>No products found</h3>
              <p>Try a different keyword or adjust the price range.</p>
            </div>
          )}

          <Pagination pageData={pageData} onPageChange={(page) => fetchProducts({ page, activeFilters: submittedFilters })} />
        </>
      )}
    </section>
  )
}
