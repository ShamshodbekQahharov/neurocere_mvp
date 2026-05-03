# NeuroCare MVP — Database Migration

## Appetite column type change: INTEGER → TEXT

### Muammo
Backend va frontend `appetite` maydoni uchun 'poor', 'fair', 'good', 'excellent' qiymatlari ishlatayapti, lekin database schema da INTEGER (1-10) sifatida belgilangan. Bu `/api/reports` endpointida 500 xatolik sabab bo'ladi.

### Qadamlar

1. **Supabase Dashboard** ga kiring: https://supabase.com/dashboard
2. Project: `neurocare-mvp` (yoki nighfixzkelbvkphbsbu)
3. **SQL Editor** bo'limiga o'ting
4. Quyidagi SQL ni paste qiling va RUN qiling:

```sql
-- Migration: Change appetite from INTEGER to TEXT
BEGIN;

-- Drop the old check constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_appetite_check;

-- Change column type to TEXT with new validation
ALTER TABLE reports 
  ALTER COLUMN appetite TYPE TEXT 
  USING CASE 
    WHEN appetite = 1 THEN 'poor'
    WHEN appetite = 2 THEN 'fair'
    WHEN appetite = 3 THEN 'good'
    WHEN appetite = 4 THEN 'excellent'
    ELSE 'fair'
  END;

-- Add new check constraint
ALTER TABLE reports 
  ADD CONSTRAINT reports_appetite_check 
  CHECK (appetite IN ('poor', 'fair', 'good', 'excellent'));

COMMIT;
```

5. Success xabari kelgach, `/api/health` endpointini tekshirib ko'ring.

### Tekshirish

```bash
curl https://neuroceremvp-production.up.railway.app/api/health
```

Va reports endpointni sinab ko'ring:

```powershell
# Doctor login
$body = @{ email = "doctor@test.com"; password = "test123" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "https://neuroceremvp-production.up.railway.app/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
$token = $login.data.token

# Test reports
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "https://neuroceremmvp-production.up.railway.app/api/reports?limit=5" -Method GET -Headers $headers
```

Expected: 200 OK with reports array.
