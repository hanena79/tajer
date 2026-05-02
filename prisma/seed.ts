import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const adapter = new PrismaBetterSqlite3({
  url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create store
  const store = await prisma.store.upsert({
    where: { id: 'store-1' },
    update: { currency: 'MRU' },
    create: {
      id: 'store-1',
      name: 'متجر تاجر',
      address: 'نواكشوط، موريتانيا',
      phone: '+222 20 00 00 00',
      currency: 'MRU',
      taxRate: 0,
    },
  })

  // Admin user
  const adminHash = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'admin@tajer.mr' },
    update: {},
    create: {
      email: 'admin@tajer.mr',
      name: 'مدير النظام',
      password: adminHash,
      role: 'ADMIN',
      locale: 'ar',
      storeId: store.id,
    },
  })

  // Cashier user
  const cashierHash = await bcrypt.hash('cashier123', 10)
  await prisma.user.upsert({
    where: { email: 'cashier@tajer.mr' },
    update: {},
    create: {
      email: 'cashier@tajer.mr',
      name: 'أمين الصندوق',
      password: cashierHash,
      role: 'CASHIER',
      locale: 'ar',
      storeId: store.id,
    },
  })

  // Categories
  const cat1 = await prisma.category.upsert({
    where: { id: 'cat-electronics' },
    update: {},
    create: { id: 'cat-electronics', name_ar: 'إلكترونيات', name_fr: 'Électronique', storeId: store.id },
  })
  const cat2 = await prisma.category.upsert({
    where: { id: 'cat-food' },
    update: {},
    create: { id: 'cat-food', name_ar: 'مواد غذائية', name_fr: 'Alimentation', storeId: store.id },
  })
  const cat3 = await prisma.category.upsert({
    where: { id: 'cat-clothing' },
    update: {},
    create: { id: 'cat-clothing', name_ar: 'ملابس', name_fr: 'Vêtements', storeId: store.id },
  })

  // 10 products
  const productDefs = [
    { id: 'prod-1', name_ar: 'حاسوب محمول', name_fr: 'Ordinateur portable', sku: 'LAP-001', barcode: '1111111111', purchasePrice: 80000, salePrice: 95000, quantity: 10, minQuantity: 2, categoryId: cat1.id },
    { id: 'prod-2', name_ar: 'فأرة حاسوب', name_fr: 'Souris', sku: 'MOU-001', barcode: '2222222222', purchasePrice: 1200, salePrice: 1800, quantity: 50, minQuantity: 5, categoryId: cat1.id },
    { id: 'prod-3', name_ar: 'لوحة مفاتيح', name_fr: 'Clavier', sku: 'KEY-001', barcode: '3333333333', purchasePrice: 2000, salePrice: 2800, quantity: 30, minQuantity: 5, categoryId: cat1.id },
    { id: 'prod-4', name_ar: 'ماء 1.5 لتر', name_fr: 'Eau 1.5L', sku: 'WAT-001', barcode: '4444444444', purchasePrice: 20, salePrice: 35, quantity: 200, minQuantity: 20, categoryId: cat2.id },
    { id: 'prod-5', name_ar: 'قهوة نسكافيه', name_fr: 'Café Nescafé', sku: 'COF-001', barcode: '5555555555', purchasePrice: 250, salePrice: 350, quantity: 100, minQuantity: 10, categoryId: cat2.id },
    { id: 'prod-6', name_ar: 'أرز 5 كيلو', name_fr: 'Riz 5kg', sku: 'RIC-001', barcode: '6666666666', purchasePrice: 400, salePrice: 550, quantity: 150, minQuantity: 15, categoryId: cat2.id },
    { id: 'prod-7', name_ar: 'قميص رجالي', name_fr: 'Chemise homme', sku: 'SHT-001', barcode: '7777777777', purchasePrice: 800, salePrice: 1200, quantity: 25, minQuantity: 5, categoryId: cat3.id },
    { id: 'prod-8', name_ar: 'بنطلون جينز', name_fr: 'Jean', sku: 'JEA-001', barcode: '8888888888', purchasePrice: 1500, salePrice: 2200, quantity: 20, minQuantity: 3, categoryId: cat3.id },
    { id: 'prod-9', name_ar: 'حذاء رياضي', name_fr: 'Chaussure sport', sku: 'SHO-001', barcode: '9999999999', purchasePrice: 2500, salePrice: 3500, quantity: 3, minQuantity: 5, categoryId: cat3.id },
    { id: 'prod-10', name_ar: 'سماعات لاسلكية', name_fr: 'Écouteurs sans fil', sku: 'HEA-001', barcode: '0000000001', purchasePrice: 5000, salePrice: 7500, quantity: 15, minQuantity: 3, categoryId: cat1.id },
  ]

  for (const p of productDefs) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, storeId: store.id },
    })
  }

  // 5 sales
  const allProducts = await prisma.product.findMany({ where: { storeId: store.id }, take: 10 })

  for (let i = 0; i < 5; i++) {
    const p1 = allProducts[i]
    const p2 = allProducts[i + 1]
    const item1Total = p1.salePrice * 2
    const item2Total = p2.salePrice * 1
    const total = item1Total + item2Total
    const invNum = `INV-${String(i + 1).padStart(4, '0')}`

    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: invNum } })
    if (existing) continue

    const sale = await prisma.sale.create({
      data: {
        totalAmount: total,
        discount: 0,
        tax: 0,
        paymentMethod: i % 2 === 0 ? 'CASH' : 'MOBILE',
        status: 'COMPLETED',
        userId: user.id,
        storeId: store.id,
        items: {
          create: [
            { quantity: 2, unitPrice: p1.salePrice, totalPrice: item1Total, productId: p1.id },
            { quantity: 1, unitPrice: p2.salePrice, totalPrice: item2Total, productId: p2.id },
          ],
        },
      },
    })

    await prisma.invoice.create({
      data: {
        invoiceNumber: invNum,
        status: 'PAID',
        totalAmount: total,
        tax: 0,
        saleId: sale.id,
        storeId: store.id,
      },
    })
  }

  console.log('✅ Seed completed!')
  console.log('   Admin: admin@tajer.mr / admin123')
  console.log('   Cashier: cashier@tajer.mr / cashier123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
