import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Plus, Minus, User, Phone, CreditCard, Receipt, LogOut } from 'lucide-react';
import axios from 'axios';

const POS = ({ user, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('نقدي');
  const [customerPoints, setCustomerPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/products');
      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCustomerByPhone = async (phone) => {
    if (phone.length >= 10) {
      try {
        const response = await axios.get(`http://localhost:5001/api/customers/phone/${phone}`);
        if (response.data.success) {
          const customer = response.data.customer;
          setCustomerName(customer.name);
          setCustomerPoints(customer.loyalty_points);
        } else {
          setCustomerPoints(0);
        }
      } catch (error) {
        setCustomerPoints(0);
      }
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.product_id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.product_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculatePoints = () => {
    return Math.floor(calculateTotal() / 10);
  };

  const handleSale = async () => {
    if (cart.length === 0 || !customerName || !customerPhone) {
      setMessage('يرجى إضافة منتجات وبيانات العميل');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        total_amount: calculateTotal(),
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price
        }))
      };

      const response = await axios.post('http://localhost:5001/api/sales', saleData);
      
      if (response.data.success) {
        setMessage(`تم إنجاز البيع بنجاح! رقم الفاتورة: ${response.data.invoice_number}`);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerPoints(customerPoints + response.data.points_earned);
        fetchProducts(); // Refresh products to update quantities
      }
    } catch (error) {
      setMessage('حدث خطأ أثناء إنجاز البيع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-rose-700">نقطة البيع - يلو روز</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">مرحباً، {user.username}</span>
          <Button variant="outline" onClick={onLogout} size="sm">
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>المنتجات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map(product => (
                  <Card key={product.product_id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-right">{product.name}</h3>
                      <p className="text-sm text-gray-600 text-right">{product.category_name}</p>
                      <div className="flex justify-between items-center mt-2">
                        <Button
                          onClick={() => addToCart(product)}
                          size="sm"
                          className="bg-rose-500 hover:bg-rose-600"
                          disabled={product.quantity <= 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <div className="text-right">
                          <p className="font-bold text-rose-600">{product.price} ر.س</p>
                          <p className="text-xs text-gray-500">متوفر: {product.quantity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart and Customer Section */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 ml-2" />
                بيانات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerPhone">رقم الجوال</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    fetchCustomerByPhone(e.target.value);
                  }}
                  placeholder="05xxxxxxxx"
                  className="text-right"
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="customerName">اسم العميل</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-right"
                  dir="rtl"
                />
              </div>
              {customerPoints > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">
                    نقاط الولاء الحالية: {customerPoints}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 ml-2" />
                سلة المشتريات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-4">السلة فارغة</p>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.price} × {item.quantity} = {(item.price * item.quantity).toFixed(2)} ر.س</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 ml-2" />
                الدفع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>وسيلة الدفع</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="نقدي">نقدي</SelectItem>
                    <SelectItem value="بطاقة">بطاقة</SelectItem>
                    <SelectItem value="تحويل">تحويل بنكي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>الإجمالي:</span>
                  <span className="font-bold text-lg">{calculateTotal().toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>نقاط ستُكتسب:</span>
                  <span>{calculatePoints()} نقطة</span>
                </div>
              </div>

              <Button
                onClick={handleSale}
                className="w-full bg-rose-500 hover:bg-rose-600"
                disabled={loading || cart.length === 0}
              >
                <Receipt className="h-4 w-4 ml-2" />
                {loading ? 'جاري المعالجة...' : 'إنجاز البيع'}
              </Button>

              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default POS;

