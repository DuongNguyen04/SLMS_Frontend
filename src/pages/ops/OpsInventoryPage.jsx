import { useEffect, useState } from 'react'
import Pagination from '../../components/Pagination'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage, normalizePage } from '../../utils/apiHelpers'

const PAGE_SIZE = 10
const PRODUCT_IMAGE_FALLBACK = 'https://picsum.photos/seed/slms-inventory-fallback/240/180'

function mapToStockForm(items) {
  const formMap = {}
  items.forEach((item) => {
    formMap[item.name] = item.stockQuantity
  })
  return formMap
}

export default function OpsInventoryPage() {
  const [keyword, setKeyword] = useState('')
  const [pageData, setPageData] = useState(() => normalizePage(null, 0, PAGE_SIZE))
  const [stockMap, setStockMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const fetchInventory = async (page = 0, activeKeyword = keyword) => {
    setLoading(true)
    setError('')

    try {
      const payload = await slmsApi.listInventory({
        page,
        size: PAGE_SIZE,
        keyword: activeKeyword || undefined,
      })
      setPageData(payload)
      setStockMap(mapToStockForm(payload.content))
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const payload = await slmsApi.listInventory({
          page: 0,
          size: PAGE_SIZE,
        })
        setPageData(payload)
        setStockMap(mapToStockForm(payload.content))
      } catch (fetchError) {
        setError(getErrorMessage(fetchError))
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const updateStock = async (productName) => {
    setError('')
    setNotice('')

    try {
      await slmsApi.adjustStock(productName, {
        stockQuantity: Number(stockMap[productName]),
      })
      setNotice(`Stock updated for ${productName}.`)
      await fetchInventory(pageData.number, keyword)
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    }
  }

  return (
    <section className="panel reveal">
      <div className="section-head">
        <div>
          <p className="eyebrow">Ops Inventory</p>
          <h2>Stock levels</h2>
        </div>

        <form
          className="inline-form-row"
          onSubmit={(event) => {
            event.preventDefault()
            fetchInventory(0, keyword)
          }}
        >
          <label>
            Product keyword
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      {loading ? (
        <p className="loading-panel">Loading inventory...</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageData.content.map((item) => (
                  <tr key={item.name}>
                    <td>
                      <div className="table-product-media">
                        <img
                          className="table-product-image"
                          src={item.imageUrl || PRODUCT_IMAGE_FALLBACK}
                          alt={`Image for ${item.name}`}
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td>{item.name}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="cell-input"
                        value={stockMap[item.name] ?? item.stockQuantity}
                        onChange={(event) =>
                          setStockMap((prev) => ({
                            ...prev,
                            [item.name]: event.target.value,
                          }))
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => updateStock(item.name)}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination pageData={pageData} onPageChange={(page) => fetchInventory(page, keyword)} />
        </>
      )}
    </section>
  )
}
