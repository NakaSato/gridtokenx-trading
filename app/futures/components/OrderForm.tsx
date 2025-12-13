import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { defaultApiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { FuturesProduct } from '@/types/futures'

export default function OrderForm({ onOrderPlaced }: { onOrderPlaced: () => void }) {
    const [products, setProducts] = useState<FuturesProduct[]>([])
    const [selectedProduct, setSelectedProduct] = useState<string>('')
    const [side, setSide] = useState<'long' | 'short'>('long')
    const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
    const [quantity, setQuantity] = useState('')
    const [price, setPrice] = useState('')
    const [leverage, setLeverage] = useState('1')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        const { data, error } = await defaultApiClient.getFuturesProducts()
        if (data && data.length > 0) {
            setProducts(data)
            setSelectedProduct(data[0].id)
        } else if (error) {
            toast.error('Failed to load futures products')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!selectedProduct) {
            toast.error('Please select a product')
            setLoading(false)
            return
        }

        const payload = {
            product_id: selectedProduct,
            side,
            order_type: orderType,
            quantity: Number(quantity),
            price: Number(price) || 0,
            leverage: Number(leverage)
        }

        const { error } = await defaultApiClient.createFuturesOrder(payload)

        if (error) {
            toast.error(error)
        } else {
            toast.success('Order placed successfully')
            setQuantity('')
            setPrice('')
            onOrderPlaced()
        }
        setLoading(false)
    }

    return (
        <Card className="h-fit">
            <CardHeader>
                <CardTitle>Place Order</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant={side === 'long' ? 'default' : 'outline'}
                            className={side === 'long' ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={() => setSide('long')}
                        >
                            Long
                        </Button>
                        <Button
                            type="button"
                            variant={side === 'short' ? 'default' : 'outline'}
                            className={side === 'short' ? 'bg-red-600 hover:bg-red-700' : ''}
                            onClick={() => setSide('short')}
                        >
                            Short
                        </Button>
                    </div>

                    <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="market">Market</TabsTrigger>
                            <TabsTrigger value="limit">Limit</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="space-y-2">
                        <Label>Product</Label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                        >
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.symbol}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Quantity (Contracts)</Label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                            min="1"
                        />
                    </div>

                    {orderType === 'limit' && (
                        <div className="space-y-2">
                            <Label>Price</Label>
                            <Input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                                min="0.01"
                                step="0.01"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Leverage (x)</Label>
                        <Input
                            type="number"
                            value={leverage}
                            onChange={(e) => setLeverage(e.target.value)}
                            required
                            min="1"
                            max="20"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {side === 'long' ? 'Buy / Long' : 'Sell / Short'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
