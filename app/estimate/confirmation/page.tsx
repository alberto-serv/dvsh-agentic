"use client"

import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Calendar, User, Phone as PhoneIcon, DollarSign, Shield } from "lucide-react"
import { format } from "date-fns"

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

const serviceNames: Record<string, string> = {
  "dryer-vent-cleaning": "Dryer Vent Cleaning",
  "dryer-vent-special": "Dryer Vent Cleaning Special",
  "dryer-vent-duct-bundle": "Dryer Vent + Air Duct Cleaning Bundle",
  "dryer-vent-duct-repair": "Dryer Vent Duct Repair",
  "bathroom-fan": "Bathroom Fan Cleaning",
  "coil-cleaning": "Coil Cleaning",
  "ac-duct-cleaning": "AC Duct Cleaning",
  "whole-home-air": "Whole-Home Air Package",
}

type Confirmation = {
  services?: { selectedServices?: string[] }
  customer?: {
    name?: string
    email?: string
    phone?: string
    address?: string
    preferredDate?: string
    timeWindow?: string
  }
  payment?: { total?: number }
}

export default function ConfirmationPage() {
  const [data, setData] = useState<Confirmation | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [orderId] = useState(() => `DVS${Math.floor(100000 + Math.random() * 900000)}`)

  useEffect(() => {
    let raw: string | null = null
    try {
      raw = window.localStorage.getItem("bookingConfirmation")
    } catch {
      raw = null
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (raw) setData(JSON.parse(raw))
    setHydrated(true)
  }, [])

  const money = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const header = (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/dvsh-logo.webp" alt="Dryer Vent Superheroes" width={56} height={47} className="h-12 w-auto" priority />
      </Link>
      <a href="tel:+16156322980" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <PhoneIcon className="h-4 w-4" />
        (615) 632-2980
      </a>
    </header>
  )

  if (!hydrated) return <div className="min-h-dvh bg-background">{header}</div>

  if (!data) {
    return (
      <div className="min-h-dvh bg-background">
        {header}
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-foreground">No booking found</h1>
          <Button asChild className="mt-5 bg-[#2A75AE] hover:bg-[#2A75AE]/90">
            <Link href="/">Back to assistant</Link>
          </Button>
        </div>
      </div>
    )
  }

  const selected: string[] = data.services?.selectedServices || []
  const customer = data.customer || {}
  const total = data.payment?.total ?? 0
  const repairOnly = selected.length === 1 && selected[0] === "dryer-vent-duct-repair"

  return (
    <div className="min-h-dvh bg-background">
      {header}
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">You&apos;re booked!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirmation #{orderId} — a receipt is on its way to your inbox.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-[#2A75AE]" />
                  <span>Appointment</span>
                </div>
                <div className="pl-6 text-sm text-muted-foreground">
                  {customer.preferredDate && <p>{format(new Date(customer.preferredDate), "EEEE, MMMM do, yyyy")}</p>}
                  <p>{timeWindows[customer.timeWindow ?? ""] || "Flexible"}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-[#2A75AE]" />
                  <span>Services</span>
                </div>
                <ul className="pl-6 text-sm text-muted-foreground">
                  {selected.map((id) => (
                    <li key={id}>{serviceNames[id] ?? id}</li>
                  ))}
                </ul>
              </div>

              {(customer.name || customer.email || customer.phone) && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4 text-[#2A75AE]" />
                      <span>Contact</span>
                    </div>
                    <div className="pl-6 text-sm text-muted-foreground">
                      {customer.name && <p>{customer.name}</p>}
                      {customer.email && <p>{customer.email}</p>}
                      {customer.phone && <p>{customer.phone}</p>}
                      {customer.address && <p>{customer.address}</p>}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <DollarSign className="h-4 w-4 text-[#2A75AE]" />
                  <span>{repairOnly ? "Charged today" : "Total charged"}</span>
                </div>
                <span className="text-lg font-bold">${money(total)}</span>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>Secured by Dryer Vent Superheroes</span>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button asChild variant="outline">
              <Link href="/">Back to assistant</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
