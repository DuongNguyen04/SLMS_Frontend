import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { slmsApi } from '../../api/slmsApi'
import { getErrorMessage } from '../../utils/apiHelpers'
import { formatCurrency } from '../../utils/format'

const PRODUCT_IMAGE_FALLBACK = 'https://picsum.photos/seed/slms-cart-product-fallback/240/180'
const AUTO_UPDATE_DEBOUNCE_MS = 450

function buildQuantityMap(items) {
  const map = {}
  items.forEach((item) => {
    map[item.productName] = item.quantity
  })
  return map
}

function parsePositiveInteger(value) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [quantityMap, setQuantityMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyProductName, setBusyProductName] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const quantityMapRef = useRef({})
  const updateTimerRef = useRef({})

  const loadCart = async () => {
    setLoading(true)
    setError('')

    try {
      const payload = await slmsApi.getMyCart()
      const effectiveCart = payload ?? {
        customerUsername: '',
        items: [],
        totalPrice: 0,
      }
      setCart(effectiveCart)
      setQuantityMap(buildQuantityMap(effectiveCart.items || []))
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  useEffect(() => {
    quantityMapRef.current = quantityMap
  }, [quantityMap])

  useEffect(() => {
    const timerMap = updateTimerRef.current
    return () => {
      Object.values(timerMap).forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const hasItems = useMemo(() => (cart?.items?.length || 0) > 0, [cart])

  const getPreviewSubtotal = (item) => {
    const quantityCandidate = parsePositiveInteger(quantityMap[item.productName])
    const unitPrice = toNumber(item.unitPrice)
    const effectiveQuantity = quantityCandidate ?? item.quantity
    return unitPrice * effectiveQuantity
  }

  const previewTotal = (cart?.items || []).reduce((sum, item) => sum + getPreviewSubtotal(item), 0)

  const syncQuantity = async (productName) => {
    setError('')
    setBusyProductName(productName)

    try {
      const quantity = parsePositiveInteger(quantityMapRef.current[productName])
      if (quantity == null) {
        throw new Error('Quantity must be greater than 0.')
      }

      const payload = await slmsApi.updateCartItem(productName, { quantity })
      setCart(payload)
      setQuantityMap(buildQuantityMap(payload.items || []))
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    } finally {
      setBusyProductName('')
    }
  }

  const onQuantityChange = (productName, value) => {
    setError('')
    setNotice('')
    setQuantityMap((prev) => ({
      ...prev,
      [productName]: value,
    }))

    if (updateTimerRef.current[productName]) {
      clearTimeout(updateTimerRef.current[productName])
    }

    updateTimerRef.current[productName] = setTimeout(() => {
      syncQuantity(productName)
    }, AUTO_UPDATE_DEBOUNCE_MS)
  }

  const onQuantityBlur = (productName) => {
    if (updateTimerRef.current[productName]) {
      clearTimeout(updateTimerRef.current[productName])
      updateTimerRef.current[productName] = null
    }

    syncQuantity(productName)
  }

  const removeItem = async (productName) => {
    setError('')
    setNotice('')
    setBusyProductName(productName)

    if (updateTimerRef.current[productName]) {
      clearTimeout(updateTimerRef.current[productName])
      updateTimerRef.current[productName] = null
    }

    try {
      await slmsApi.removeCartItem(productName)
      await loadCart()
      setNotice(`Removed ${productName} from cart.`)
    } catch (removeError) {
      setError(getErrorMessage(removeError))
    } finally {
      setBusyProductName('')
    }
  }

  const clearCart = async () => {
    setError('')
    setNotice('')

    try {
      await slmsApi.clearCart()
      await loadCart()
      setNotice('Cart cleared.')
    } catch (clearError) {
      setError(getErrorMessage(clearError))
    }
  }

  const checkout = async () => {
    setError('')
    setNotice('')
    setIsCheckingOut(true)

    const trimmedAddress = shippingAddress.trim()
    const trimmedPhone = phoneNumber.trim()
    if (!trimmedAddress || !trimmedPhone) {
      setError('Shipping address and phone number are required.')
      setIsCheckingOut(false)
      return
    }

    try {
      const order = await slmsApi.placeOrder({
        shippingAddress: trimmedAddress,
        phoneNumber: trimmedPhone,
      })
      navigate(`/shop/orders/${encodeURIComponent(order.orderId)}`)
    } catch (checkoutError) {
      setError(getErrorMessage(checkoutError))
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (loading) {
    return <div className="panel loading-panel">Loading cart...</div>
  }

  return (
    <section className="panel reveal">
      <p className="eyebrow">Cart and Checkout</p>
      <h2>Your cart</h2>

      {notice && <p className="inline-success">{notice}</p>}
      {error && <p className="inline-error">{error}</p>}

      {!hasItems ? (
        <div className="empty-panel">
          <h3>Cart is empty</h3>
          <p>Add products from the catalog to continue.</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Unit price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <tr key={item.productName}>
                    <td>
                      <div className="table-product-media">
                        <img
                          className="table-product-image"
                          src={item.imageUrl || PRODUCT_IMAGE_FALLBACK}
                          alt={`Image for ${item.productName}`}
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td>{item.productName}</td>
                    <td>{formatCurrency(item.unitPrice || 0)}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={quantityMap[item.productName] ?? item.quantity}
                        onChange={(event) => onQuantityChange(item.productName, event.target.value)}
                        onBlur={() => onQuantityBlur(item.productName)}
                        disabled={busyProductName === item.productName}
                        className="cell-input"
                      />
                    </td>
                    <td>{formatCurrency(getPreviewSubtotal(item))}</td>
                    <td>
                      <div className="button-row compact">
                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={busyProductName === item.productName}
                          onClick={() => removeItem(item.productName)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sub-panel">
            <h3>Shipping details</h3>
            <div className="inline-form-row">
              <label>
                Address
                <input
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  placeholder="Street, city, region"
                />
              </label>
              <label>
                Phone number
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="Phone number"
                />
              </label>
            </div>
          </div>

          <div className="checkout-row">
            <p className="checkout-total">Total: {formatCurrency(previewTotal)}</p>
            <div className="button-row">
              <button type="button" className="btn btn-ghost" onClick={clearCart}>
                Clear cart
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={checkout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? 'Placing order...' : 'Checkout'}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
