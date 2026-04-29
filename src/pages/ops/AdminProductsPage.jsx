import { useEffect, useState } from 'react'
import Pagination from '../../components/Pagination'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage, normalizePage } from '../../utils/apiHelpers'
import { formatCurrency } from '../../utils/format'

const PAGE_SIZE = 10
const PRODUCT_IMAGE_FALLBACK = 'https://picsum.photos/seed/slms-admin-products-fallback/240/180'

function mapEditData(items) {
  const map = {}
  items.forEach((item) => {
    map[item.name] = {
      name: item.name,
      price: item.price,
      stockQuantity: item.stockQuantity,
      imageUrl: item.imageUrl || '',
    }
  })
  return map
}

export default function AdminProductsPage() {
  const [pageData, setPageData] = useState(() => normalizePage(null, 0, PAGE_SIZE))
  const [editMap, setEditMap] = useState({})
  const [createForm, setCreateForm] = useState({ name: '', price: '', stockQuantity: '', imageUrl: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const fetchProducts = async (page = 0) => {
    setLoading(true)
    setError('')

    try {
      const payload = await slmsApi.listProducts({ page, size: PAGE_SIZE })
      setPageData(payload)
      setEditMap(mapEditData(payload.content))
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(0)
  }, [])

  const createProduct = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    try {
      await slmsApi.createProduct({
        name: createForm.name,
        price: Number(createForm.price),
        stockQuantity: Number(createForm.stockQuantity),
        imageUrl: createForm.imageUrl.trim(),
      })
      setCreateForm({ name: '', price: '', stockQuantity: '', imageUrl: '' })
      setNotice('Product created.')
      await fetchProducts(0)
    } catch (createError) {
      setError(getErrorMessage(createError))
    }
  }

  const saveProduct = async (originalName) => {
    setError('')
    setNotice('')

    try {
      const target = editMap[originalName]
      const payload = {
        name: target.name,
        price: Number(target.price),
        stockQuantity: Number(target.stockQuantity),
      }

      const normalizedImageUrl = target.imageUrl?.trim()
      if (normalizedImageUrl) {
        payload.imageUrl = normalizedImageUrl
      }

      await slmsApi.updateProduct(originalName, payload)
      setNotice(`Product ${originalName} updated.`)
      await fetchProducts(pageData.number)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    }
  }

  const deleteProduct = async (name) => {
    setError('')
    setNotice('')

    try {
      await slmsApi.deleteProduct(name)
      setNotice(`Product ${name} deleted.`)
      await fetchProducts(pageData.number)
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  return (
    <section className="panel reveal">
      <p className="eyebrow">Admin Products</p>
      <h2>Catalog management</h2>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      <form className="inline-form-row" onSubmit={createProduct}>
        <label>
          Name
          <input
            value={createForm.name}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </label>
        <label>
          Price
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={createForm.price}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, price: event.target.value }))}
            required
          />
        </label>
        <label>
          Stock
          <input
            type="number"
            min="0"
            value={createForm.stockQuantity}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, stockQuantity: event.target.value }))
            }
            required
          />
        </label>
        <label>
          Image URL
          <input
            type="url"
            value={createForm.imageUrl}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, imageUrl: event.target.value }))
            }
            placeholder="https://example.com/product.jpg"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Create
        </button>
      </form>

      {loading ? (
        <p className="loading-panel">Loading products...</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Image URL</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.content.map((item) => {
                  const edit = editMap[item.name] || item

                  return (
                    <tr key={item.name}>
                      <td>
                        <div className="table-product-media">
                          <img
                            className="table-product-image"
                            src={edit.imageUrl || PRODUCT_IMAGE_FALLBACK}
                            alt={`Image for ${edit.name || item.name}`}
                            loading="lazy"
                          />
                        </div>
                      </td>
                      <td>
                        <input
                          className="cell-input"
                          value={edit.name}
                          onChange={(event) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [item.name]: { ...prev[item.name], name: event.target.value },
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={edit.price}
                          onChange={(event) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [item.name]: { ...prev[item.name], price: event.target.value },
                            }))
                          }
                        />
                        <p className="micro-text">{formatCurrency(edit.price)}</p>
                      </td>
                      <td>
                        <input
                          className="cell-input"
                          type="number"
                          min="0"
                          value={edit.stockQuantity}
                          onChange={(event) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [item.name]: {
                                ...prev[item.name],
                                stockQuantity: event.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="cell-input"
                          type="url"
                          value={edit.imageUrl}
                          onChange={(event) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [item.name]: {
                                ...prev[item.name],
                                imageUrl: event.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                      <td>
                        <div className="button-row compact">
                          <button type="button" className="btn btn-primary" onClick={() => saveProduct(item.name)}>
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => deleteProduct(item.name)}
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

          <Pagination pageData={pageData} onPageChange={fetchProducts} />
        </>
      )}
    </section>
  )
}
