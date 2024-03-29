'use client'

import cn from 'clsx'
import { Button } from 'components/button'
import { Image } from 'components/image'
import { useBeforeUnload } from 'hooks/use-before-unload'
import { createContext, useContext, useOptimistic, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { removeItem, updateItemQuantity } from '../actions'
import s from './modal.module.scss'

const ModalContext = createContext()

export function CartModal({ children, cart }) {
  const [isOpen, setIsOpen] = useState(false)
  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  return (
    <ModalContext.Provider value={openCart}>
      {children}
      <div className={cn(s.modal, isOpen && s.open)}>
        <div className={s['catch-click']} onClick={closeCart} />
        <div className={s.inner}>
          <button className={cn('p-xs', s.close)} onClick={closeCart}>
            close
          </button>
          {!cart || cart.lines.length === 0 ? (
            <EmptyCart />
          ) : (
            <InnerCart cart={cart} />
          )}
        </div>
      </div>
    </ModalContext.Provider>
  )
}

function EmptyCart() {
  return <p className={cn('p-l', s.heading)}>your cart is empty</p>
}

function InnerCart({ cart }) {
  return (
    <>
      <p className={cn('p-l', s.heading)}>your cart</p>
      <div className={s.lines} data-lenis-prevent>
        {cart?.lines?.map(({ id, merchandise, cost, quantity }, idx) => (
          <div className={s.line} key={`${idx}-${id}`}>
            <div className={s.media}>
              <Image
                src={merchandise?.product?.featuredImage?.url}
                alt={merchandise?.product?.featuredImage?.altText ?? ''}
                width={merchandise?.product?.featuredImage?.width}
                height={merchandise?.product?.featuredImage?.height}
              />
            </div>
            <div className={s.info}>
              <div className={s.details}>
                <p className={cn('p-s', s.title)}>
                  {merchandise?.product?.title}
                </p>
                <p className={cn('p-xs', s.description)}>
                  {merchandise?.product?.description}
                </p>
              </div>
              <p className="p-s">$ {cost?.totalAmount?.amount}</p>
            </div>
            <Quantity
              className={s.quantity}
              payload={{
                lineId: id,
                variantId: merchandise?.id,
                quantity,
              }}
            />
            <RemoveButton id={id} className={s.remove} />
          </div>
        ))}
      </div>
      <div className={s.checkout}>
        <div className={cn('p-s', s.top)}>
          <p>sub total</p>
          <p>$ {cart?.cost?.subtotalAmount?.amount}</p>
        </div>
        <Button className={s.action} href={cart?.checkoutUrl}>
          checkout
        </Button>
      </div>
    </>
  )
}

function Quantity({ className, payload }) {
  const [quantity, setQuantity] = useOptimistic(
    payload.quantity,
    (state, newState) => newState,
  )

  async function formAction(value) {
    const newQuantity = Math.max(1, quantity + value)

    setQuantity(newQuantity)
    await updateItemQuantity({
      ...payload,
      quantity: newQuantity,
    })
  }

  return (
    <div className={className}>
      <QuantityButton formAction={() => formAction(-1)}>-</QuantityButton>
      <span className="p-xs">{quantity}</span>
      <QuantityButton formAction={() => formAction(1)}>+</QuantityButton>
    </div>
  )
}

function QuantityButton({ formAction, className, children }) {
  return (
    <form action={formAction} className={className}>
      <ActionButton>{children}</ActionButton>
    </form>
  )
}

function RemoveButton({ id, className }) {
  async function formAction() {
    await removeItem(id)
  }

  return (
    <form action={formAction} className={className}>
      <ActionButton>remove</ActionButton>
    </form>
  )
}

function ActionButton({ children }) {
  const { pending } = useFormStatus()
  useBeforeUnload(pending)

  return (
    <button
      type="submit"
      onClick={(e) => {
        if (pending) {
          e.preventDefault()
        }
      }}
      className={cn('p-s', pending && s.disable)}
    >
      {children}
    </button>
  )
}

export function useCartModal() {
  return useContext(ModalContext)
}
