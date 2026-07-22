"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  CreditCard,
  Lock,
  Calendar,
  CheckCircle,
  DollarSign,
  Shield,
  Plus,
  Phone,
} from "lucide-react"
import { format } from "date-fns"
import {
  isRecurringEligible,
  frequencyMultiplier,
  hasSplitAnnualPricing,
  getAnnualFirstPayment,
  getAnnualRenewal,
  type ServiceFrequency,
} from "@/lib/service-frequency"

const ESTIMATE_KEY = "estimateData"

const timeWindows: Record<string, string> = {
  morning: "8:00 AM - 12:00 PM",
  afternoon: "12:00 PM - 4:00 PM",
  flexible: "Any Time",
  "8am": "8:00 AM - 9:00 AM",
  "10am": "10:00 AM - 11:00 AM",
  "11am": "11:00 AM - 12:00 PM",
  "1pm": "1:00 PM - 2:00 PM",
  "2pm": "2:00 PM - 3:00 PM",
  "4pm": "4:00 PM - 5:00 PM",
}

const availableServices = [
  { id: "dryer-vent-cleaning", name: "Dryer Vent Cleaning", basePrice: 175 },
  { id: "dryer-vent-special", name: "Dryer Vent Cleaning Special", basePrice: 350 },
  { id: "dryer-vent-duct-bundle", name: "Dryer Vent + Air Duct Cleaning Bundle", basePrice: 0 },
  { id: "dryer-vent-duct-repair", name: "Dryer Vent Duct Repair", basePrice: 0 },
  { id: "bathroom-fan", name: "Bathroom Fan Cleaning", basePrice: 175 },
  { id: "coil-cleaning", name: "Coil Cleaning", basePrice: 385 },
  { id: "ac-duct-cleaning", name: "AC Duct Cleaning", basePrice: 500 },
  { id: "whole-home-air", name: "Whole-Home Air Package", basePrice: 0 },
]

type CheckoutAddOn = {
  id: string
  name: string
  price: number
  priceLabel?: string
}

const checkoutAddOns: CheckoutAddOn[] = [
  { id: "magnetic-vent-cover", name: "Magnetic Vent Cover", price: 110 },
  { id: "transition-hose", name: "Transition Hose Replacement", price: 75 },
  { id: "reroute", name: "Reroute", price: 189, priceLabel: "from $189" },
]

function computeWholeHome(ducts: number): number {
  const gross = 500 + Math.max(0, ducts - 10) * 30 + 385 + 175
  return Math.round(gross * 0.85)
}

type BookingData = {
  services?: Record<string, unknown> & {
    selectedServices?: string[]
    serviceFrequencies?: Record<string, ServiceFrequency>
    selectedCheckoutAddOns?: string[]
    ductCount?: number
    dryerVentAccessType?: string
    bundlePrice?: number
    specialAccessType?: string
    wholeHomeDuctCount?: number
    wholeHomePrice?: number
  }
  customer?: { preferredDate?: string; timeWindow?: string; [k: string]: unknown }
  payment?: Record<string, unknown>
}

type ServiceLine = {
  id: string
  name: string
  price: number
  discountedPrice: number
  frequency: ServiceFrequency
  splitPricing: boolean
  annualRenewal: number
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/dvsh-logo.webp"
            alt="Dryer Vent Superheroes"
            width={56}
            height={47}
            className="h-12 w-auto"
            priority
          />
        </Link>
        <a
          href="tel:+16156322980"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Phone className="h-4 w-4" />
          (615) 632-2980
        </a>
      </header>
      {children}
    </div>
  )
}

export default function PaymentPage() {
  const router = useRouter()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)

  const [cardName, setCardName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvc, setCvc] = useState("")
  const [billingZip, setBillingZip] = useState("")

  useEffect(() => {
    let stored: string | null = null
    try {
      stored =
        window.localStorage.getItem("bookingConfirmation") ??
        window.localStorage.getItem(ESTIMATE_KEY)
    } catch {
      stored = null
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setBookingData(JSON.parse(stored))
    setHydrated(true)
  }, [])

  const selectedCheckoutAddOns: string[] = bookingData?.services?.selectedCheckoutAddOns || []

  const getCheckoutAddOnsTotal = () =>
    selectedCheckoutAddOns.reduce((sum, id) => {
      const addon = checkoutAddOns.find((a) => a.id === id)
      return addon && !addon.priceLabel ? sum + addon.price : sum
    }, 0)

  const getSelectedCheckoutAddOnsDetails = () =>
    selectedCheckoutAddOns
      .map((id) => checkoutAddOns.find((a) => a.id === id))
      .filter((a): a is CheckoutAddOn => !!a)

  const getServiceFrequency = (serviceId: string): ServiceFrequency => {
    if (!isRecurringEligible(serviceId)) return "none"
    return bookingData?.services?.serviceFrequencies?.[serviceId] ?? "none"
  }

  const getServiceBasePrice = (serviceId: string): number => {
    const service = availableServices.find((s) => s.id === serviceId)
    if (!service) return 0
    const s = bookingData?.services ?? {}
    if (serviceId === "ac-duct-cleaning") {
      const ductCount = s.ductCount ?? 10
      return 500 + Math.max(0, ductCount - 10) * 30
    }
    if (serviceId === "dryer-vent-cleaning") {
      const access = s.dryerVentAccessType
      if (access === "roof") return 249
      if (access === "second-floor") return 189
      return 175
    }
    if (serviceId === "dryer-vent-duct-bundle") return s.bundlePrice ?? 0
    if (serviceId === "whole-home-air") {
      return s.wholeHomePrice ?? computeWholeHome(s.wholeHomeDuctCount ?? 10)
    }
    if (serviceId === "dryer-vent-duct-repair") return 0
    return service.basePrice
  }

  const getSelectedServicesWithDetails = () => {
    const selected: string[] = bookingData?.services?.selectedServices || []
    return selected
      .map((serviceId) => {
        const service = availableServices.find((s) => s.id === serviceId)
        if (!service) return null
        const price = getServiceBasePrice(serviceId)
        const frequency = getServiceFrequency(serviceId)
        const splitPricing = hasSplitAnnualPricing(serviceId)
        const discountedPrice =
          frequency === "annual"
            ? getAnnualFirstPayment(serviceId, price)
            : price * frequencyMultiplier(frequency)
        const annualRenewal =
          frequency === "annual"
            ? getAnnualRenewal(serviceId, price, {
                specialAccessType: bookingData?.services?.specialAccessType,
              })
            : 0
        return {
          id: service.id,
          name: service.name,
          price,
          discountedPrice,
          frequency,
          splitPricing,
          annualRenewal,
        }
      })
      .filter(Boolean) as ServiceLine[]
  }

  const isRepairOnly = () => {
    const selected: string[] = bookingData?.services?.selectedServices || []
    return selected.length === 1 && selected[0] === "dryer-vent-duct-repair"
  }

  const getSubtotal = () =>
    getSelectedServicesWithDetails().reduce((t: number, s: ServiceLine) => t + s.price, 0)
  const getDiscountedSubtotal = () =>
    getSelectedServicesWithDetails().reduce((t: number, s: ServiceLine) => t + s.discountedPrice, 0)
  const getSubscriptionDiscount = () => Math.round(getSubtotal() - getDiscountedSubtotal())
  const hasRecurringService = (): boolean => {
    const freqs = bookingData?.services?.serviceFrequencies || {}
    const selected: string[] = bookingData?.services?.selectedServices || []
    return selected.some((id) => isRecurringEligible(id) && freqs[id] === "annual")
  }
  const getTax = () =>
    (getDiscountedSubtotal() + getCheckoutAddOnsTotal() - promoDiscount) * 0.0825
  const getTotal = () =>
    getDiscountedSubtotal() + getCheckoutAddOnsTotal() - promoDiscount + getTax()

  const handleApplyPromo = () => {
    const code = promoCode.toUpperCase()
    if (code === "SAVE10") {
      setPromoDiscount(Math.round(getDiscountedSubtotal() * 0.1))
      setAppliedPromo(code)
    } else if (code === "FIRST20") {
      setPromoDiscount(Math.round(getDiscountedSubtotal() * 0.2))
      setAppliedPromo(code)
    } else {
      setPromoDiscount(0)
      setAppliedPromo(null)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const match = (v.match(/\d{4,16}/g) || [])[0] || ""
    const parts: string[] = []
    for (let i = 0; i < match.length; i += 4) parts.push(match.substring(i, i + 4))
    return parts.length ? parts.join(" ") : value
  }
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    return v.length >= 2 ? v.substring(0, 2) + "/" + v.substring(2, 4) : v
  }

  const money = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingData) return
    setIsLoading(true)
    const repairOnly = isRepairOnly()
    if (!repairOnly) await new Promise((r) => setTimeout(r, 1600))
    const confirmationData = {
      ...bookingData,
      services: {
        ...bookingData.services,
        selectedCheckoutAddOns,
        checkoutAddOnsTotal: getCheckoutAddOnsTotal(),
      },
      payment: repairOnly
        ? { method: "none", promoCode: null, promoDiscount: 0, total: 0 }
        : {
            last4: cardNumber.replace(/\s/g, "").slice(-4),
            promoCode: appliedPromo,
            promoDiscount,
            total: getTotal(),
          },
    }
    try {
      window.localStorage.setItem("bookingConfirmation", JSON.stringify(confirmationData))
      window.localStorage.removeItem(ESTIMATE_KEY)
    } catch {
      // ignore
    }
    router.push("/estimate/confirmation")
  }

  if (!hydrated) return <CheckoutShell><div className="p-10" /></CheckoutShell>

  if (!bookingData) {
    return (
      <CheckoutShell>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-foreground">Nothing to check out yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Head back to the booking assistant to build your estimate.
          </p>
          <Button asChild className="mt-5 bg-[#2A75AE] hover:bg-[#2A75AE]/90">
            <Link href="/">Back to assistant</Link>
          </Button>
        </div>
      </CheckoutShell>
    )
  }

  return (
    <CheckoutShell>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              {isRepairOnly() ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#2A75AE]" />
                      No Payment Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-foreground">
                      You&apos;ve selected our <span className="font-semibold">Dryer Vent Duct Repair</span> free
                      on-site estimate. There&apos;s no charge today and no card on file.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      A technician will visit at your selected appointment window, inspect the duct, and provide a
                      written quote on the spot.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-[#2A75AE]" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitPayment} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card *</Label>
                        <Input id="cardName" placeholder="John Doe" value={cardName}
                          onChange={(e) => setCardName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number *</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="cardNumber" placeholder="1234 5678 9012 3456" value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            maxLength={19} className="pl-10" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Expiry Date *</Label>
                          <Input id="expiryDate" placeholder="MM/YY" value={expiryDate}
                            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                            maxLength={5} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="cvc" placeholder="123" value={cvc}
                              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              maxLength={4} className="pl-10" required />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingZip">Billing ZIP Code *</Label>
                        <Input id="billingZip" placeholder="12345" value={billingZip}
                          onChange={(e) => setBillingZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                          maxLength={5} required />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                        <Lock className="h-4 w-4" />
                        <span>Your payment information is secure and encrypted</span>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {!isRepairOnly() && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[#2A75AE]" />
                      Promo Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Input placeholder="Enter promo code" value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)} className="flex-1" />
                      <Button type="button" variant="outline" onClick={handleApplyPromo}>Apply</Button>
                    </div>
                    {appliedPromo && (
                      <p className="text-sm text-green-600 mt-2">Promo code &quot;{appliedPromo}&quot; applied!</p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-blue-50 border-[#2A75AE]/20">
                <CardContent className="p-4">
                  {isRepairOnly() ? (
                    <p className="text-sm text-foreground">
                      Your appointment is fully complimentary — no card is required to book this estimate.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-foreground">You&apos;ll be charged today and your service will be scheduled.</p>
                      <p className="text-sm text-muted-foreground mt-1">Payment is fully refundable prior to your first service.</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="lg:hidden">
                <Button onClick={handleSubmitPayment} disabled={isLoading}
                  className="w-full bg-[#2A75AE] hover:bg-[#2A75AE]/90" size="lg">
                  {isLoading ? "Processing..." : isRepairOnly() ? "Book Free Estimate" : `Pay $${money(getTotal())}`}
                </Button>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Appointment</span>
                    </div>
                    <div className="pl-6 text-sm text-muted-foreground">
                      {bookingData.customer?.preferredDate && (
                        <p>{format(new Date(bookingData.customer.preferredDate), "EEEE, MMMM do, yyyy")}</p>
                      )}
                      <p>{timeWindows[bookingData.customer?.timeWindow as keyof typeof timeWindows] || "Flexible"}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle className="h-4 w-4 text-[#2A75AE]" />
                      <span>Selected Services</span>
                    </div>
                    <div className="space-y-2 pl-6">
                      {getSelectedServicesWithDetails().map((service: ServiceLine) => {
                        const isAnnual = service.frequency === "annual"
                        return (
                          <div key={service.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {service.name}
                              {isAnnual && <span className="ml-1 text-[10px] font-medium text-[#2A75AE]">(Annual)</span>}
                            </span>
                            <span className="text-right">
                              <span className="font-medium tabular-nums block">
                                ${Math.round(service.discountedPrice).toLocaleString()}
                                {isAnnual && service.splitPricing && (
                                  <span className="ml-1 text-[10px] font-medium text-muted-foreground">today</span>
                                )}
                              </span>
                              {isAnnual && service.annualRenewal > 0 && (
                                <span className="block text-[10px] font-medium text-[#2A75AE] tabular-nums">
                                  then ${Math.round(service.annualRenewal).toLocaleString()}/yr
                                </span>
                              )}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {selectedCheckoutAddOns.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Plus className="h-4 w-4 text-[#2A75AE]" />
                          <span>Add-Ons</span>
                        </div>
                        <div className="space-y-1 pl-6">
                          {getSelectedCheckoutAddOnsDetails().map((addon) => (
                            <div key={addon.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{addon.name}</span>
                              <span className="font-medium tabular-nums text-right">
                                {addon.priceLabel ? (
                                  <>
                                    {addon.priceLabel}
                                    <span className="block text-[10px] font-normal text-muted-foreground">Billed on-site</span>
                                  </>
                                ) : (
                                  `$${money(addon.price)}`
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${money(getSubtotal() + getCheckoutAddOnsTotal())}</span>
                  </div>

                  {getSubscriptionDiscount() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Annual Plan Savings (15%)</span>
                      <span className="font-medium text-green-600">-${money(getSubscriptionDiscount())}</span>
                    </div>
                  )}

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Promo Code ({appliedPromo})</span>
                      <span className="font-medium text-green-600">-${money(promoDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Tax (8.25%)</span>
                    <span className="font-medium">${money(getTax())}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 font-semibold">
                      <DollarSign className="h-4 w-4 text-[#2A75AE]" />
                      <span>Total</span>
                    </div>
                    <span className="text-xl font-bold">${money(getTotal())}</span>
                  </div>

                  {hasRecurringService() && (
                    <div className="border-2 border-[#2A75AE] rounded-lg p-3 bg-[#2A75AE]/5">
                      <p className="text-xs text-[#2A75AE] leading-relaxed">
                        <span className="font-semibold">Annual Plan:</span> Recurring services renew yearly with 15% savings. Cancel anytime.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                    <Shield className="h-4 w-4" />
                    <span>Secure checkout</span>
                  </div>

                  <div className="hidden lg:block pt-2">
                    <Button onClick={handleSubmitPayment} disabled={isLoading}
                      className="w-full bg-[#2A75AE] hover:bg-[#2A75AE]/90" size="lg">
                      {isLoading ? "Processing..." : isRepairOnly() ? "Book Free Estimate" : `Pay $${money(getTotal())}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CheckoutShell>
  )
}
