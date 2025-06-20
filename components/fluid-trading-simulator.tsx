"use client"

import { useState, useEffect, useRef } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Area } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowUpCircle, ArrowDownCircle, Play, Pause, RefreshCw } from "lucide-react"

export default function FluidTradingSimulator() {
  // Simulation settings
  const [assetName, setAssetName] = useState("BTC")
  const [anchorPrice, setAnchorPrice] = useState(100)
  const [microTradeAmount, setMicroTradeAmount] = useState(1)
  const [tradeInterval, setTradeInterval] = useState(3)

  // Simulation state
  const [isRunning, setIsRunning] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(anchorPrice)
  const [cashBalance, setCashBalance] = useState(1000)
  const [sharesHeld, setSharesHeld] = useState(0)
  const [tradeStatus, setTradeStatus] = useState("IDLE")
  const [priceData, setPriceData] = useState([{ time: 0, price: anchorPrice }])

  // Timer reference
  const timerRef = useRef(null)

  // Calculate total portfolio value
  const totalValue = cashBalance + sharesHeld * currentPrice

  // Start simulation
  const startSimulation = () => {
    if (isRunning) return

    setIsRunning(true)

    timerRef.current = setInterval(() => {
      // Generate random price movement
      const randomChange = (Math.random() - 0.5) * 2 // Random value between -1 and 1
      const volatility = anchorPrice * 0.01 // 1% volatility
      const newPrice = currentPrice + randomChange * volatility
      setCurrentPrice(newPrice)

      // Add new price point to chart data
      setPriceData((prevData) => {
        const newData = [
          ...prevData,
          {
            time: prevData.length,
            price: newPrice,
          },
        ]

        // Keep only the last 50 data points
        if (newData.length > 50) {
          return newData.slice(newData.length - 50)
        }
        return newData
      })

      // Execute trade based on price relative to anchor
      if (newPrice < anchorPrice) {
        // Buy condition
        if (cashBalance >= microTradeAmount) {
          const sharesToBuy = microTradeAmount / newPrice
          setCashBalance((prev) => prev - microTradeAmount)
          setSharesHeld((prev) => prev + sharesToBuy)
          setTradeStatus("BUYING")
        }
      } else if (newPrice > anchorPrice) {
        // Sell condition
        if (sharesHeld > 0) {
          const sharesToSell = Math.min(sharesHeld, microTradeAmount / newPrice)
          const sellValue = sharesToSell * newPrice
          setCashBalance((prev) => prev + sellValue)
          setSharesHeld((prev) => prev - sharesToSell)
          setTradeStatus("SELLING")
        }
      } else {
        setTradeStatus("IDLE")
      }
    }, tradeInterval * 1000)
  }

  // Pause simulation
  const pauseSimulation = () => {
    if (!isRunning) return

    clearInterval(timerRef.current)
    setIsRunning(false)
    setTradeStatus("PAUSED")
  }

  // Reset simulation
  const resetSimulation = () => {
    clearInterval(timerRef.current)
    setIsRunning(false)
    setCurrentPrice(anchorPrice)
    setCashBalance(1000)
    setSharesHeld(0)
    setTradeStatus("IDLE")
    setPriceData([{ time: 0, price: anchorPrice }])
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Update chart when anchor price changes
  useEffect(() => {
    if (!isRunning) {
      setCurrentPrice(anchorPrice)
      setPriceData([{ time: 0, price: anchorPrice }])
    }
  }, [anchorPrice, isRunning])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Fluid Trading Simulator</h1>
          <p className="text-muted-foreground">Micropayment-based day trading concept</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Sidebar / Control Panel */}
        <aside className="w-full md:w-64 p-4 border-r bg-card">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asset-name">Asset Name</Label>
              <Input
                id="asset-name"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anchor-price">Anchor Price (USD)</Label>
              <Input
                id="anchor-price"
                type="number"
                value={anchorPrice}
                onChange={(e) => setAnchorPrice(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="micro-trade">Micro Trade Amount (USD)</Label>
              <Input
                id="micro-trade"
                type="number"
                value={microTradeAmount}
                onChange={(e) => setMicroTradeAmount(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade-interval">Trade Interval (seconds)</Label>
              <Input
                id="trade-interval"
                type="number"
                value={tradeInterval}
                onChange={(e) => setTradeInterval(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>

            <div className="flex flex-col space-y-2">
              {!isRunning ? (
                <Button onClick={startSimulation} className="w-full">
                  <Play className="mr-2 h-4 w-4" /> Start Simulation
                </Button>
              ) : (
                <Button onClick={pauseSimulation} variant="outline" className="w-full">
                  <Pause className="mr-2 h-4 w-4" /> Pause Simulation
                </Button>
              )}

              <Button onClick={resetSimulation} variant="secondary" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Dashboard */}
        <main className="flex-1 p-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            {/* Price Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Price Chart: {assetName}</CardTitle>
                <CardDescription>
                  Current Price: ${currentPrice.toFixed(2)} | Anchor: ${anchorPrice.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" label={{ value: "Time", position: "insideBottomRight", offset: 0 }} />
                    <YAxis domain={[(dataMin) => Math.floor(dataMin * 0.95), (dataMax) => Math.ceil(dataMax * 1.05)]} />
                    <ReferenceLine y={anchorPrice} stroke="#888" strokeDasharray="3 3" />
                    <defs>
                      <linearGradient id="buyZone" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="sellZone" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#buyZone)"
                      activeDot={{ r: 8 }}
                      isAnimationActive={false}
                      dot={false}
                      baseLine={anchorPrice}
                      style={{ display: currentPrice < anchorPrice ? "block" : "none" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#sellZone)"
                      activeDot={{ r: 8 }}
                      isAnimationActive={false}
                      dot={false}
                      baseLine={anchorPrice}
                      style={{ display: currentPrice > anchorPrice ? "block" : "none" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#666"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Portfolio Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
                <CardDescription>
                  Trading Status:
                  <span
                    className={`ml-2 font-medium ${
                      tradeStatus === "BUYING"
                        ? "text-green-500"
                        : tradeStatus === "SELLING"
                          ? "text-red-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {tradeStatus}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Cash Balance:</span>
                      <span className="text-xl font-semibold">${cashBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Shares Held:</span>
                      <span className="text-xl font-semibold">{sharesHeld.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Shares Value:</span>
                      <span className="text-xl font-semibold">${(sharesHeld * currentPrice).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Value:</span>
                      <span className="text-2xl font-bold">${totalValue.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      {currentPrice < anchorPrice ? (
                        <div className="flex items-center text-green-500">
                          <ArrowDownCircle className="mr-2 h-5 w-5" />
                          <span className="font-medium">BUY ZONE</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-500">
                          <ArrowUpCircle className="mr-2 h-5 w-5" />
                          <span className="font-medium">SELL ZONE</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
