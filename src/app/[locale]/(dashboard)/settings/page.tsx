'use client'

import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">{t('store')}</h2>
          <div className="space-y-4">
            {['اسم المتجر', 'العنوان', 'الهاتف', 'العملة'].map((f) => (
              <div key={f}>
                <label className="block text-sm text-gray-600 mb-1">{f}</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={f}
                />
              </div>
            ))}
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700">
              {tCommon('save')}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">التفضيلات</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('language')}</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">نسبة الضريبة (%)</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
