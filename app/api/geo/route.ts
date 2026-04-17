import { NextRequest, NextResponse } from 'next/server';

const AFRICA_COUNTRIES = [
  'SN','CI','CM','ML','BF','GN','TG','BJ','NE','TD',
  'CG','CD','GA','MG','DJ','KM','MR','RW','BI','CF',
  'GQ','SC','NG','GH','KE','TZ','UG','ET','ZA','MA',
  'DZ','TN','EG','LY','SD','SS','SO','ER','MZ','AO',
  'ZM','ZW','MW','BW','NA','SZ','LS','SL','LR','GM',
  'GW','CV','ST','MU'
];

// Pays avec PawaPay mobile money activé
const PAWAPAY_COUNTRIES = ['BJ','CM','CI','CD','GA','KE','CG','RW','SN','MG','SL','UG','ZM'];

export async function GET(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country') || '';
  const isAfrica = AFRICA_COUNTRIES.includes(country);
  const hasMobileMoney = PAWAPAY_COUNTRIES.includes(country);
  return NextResponse.json({
    country,
    price: isAfrica ? '1,99€' : '4,99€',  // 4,99 EU/monde, 1,99 Afrique
    isAfrica,
    paymentMethod: hasMobileMoney ? 'mobile_money' : 'card',
  });
}
