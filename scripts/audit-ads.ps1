$ErrorActionPreference = "Stop"
$envPath = "D:\WORKS\iPumps\MayRemp2\.env.local"
$lines = Get-Content $envPath
function Get-Env($key) { ($lines | Where-Object { $_ -match "^$key=" } | ForEach-Object { ($_ -split '=', 2)[1].Trim().Trim('"').Trim("'") }) }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ADS SYSTEM COMPREHENSIVE AUDIT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$errors = @()
$warnings = @()

# ═══════════════════════════════════════════
# 1. ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════
Write-Host "--- 1. ENVIRONMENT VARIABLES ---" -ForegroundColor Yellow

$googleVars = @{
    "GOOGLE_ADS_DEVELOPER_TOKEN" = $false
    "GOOGLE_ADS_CLIENT_ID" = $false
    "GOOGLE_ADS_CLIENT_SECRET" = $false
    "GOOGLE_ADS_REFRESH_TOKEN" = $false
    "GOOGLE_ADS_CUSTOMER_ID" = $false
}
$metaVars = @{
    "META_ACCESS_TOKEN" = $false
    "META_AD_ACCOUNT_ID" = $false
    "META_APP_SECRET" = $false
}

foreach ($k in $googleVars.Keys) {
    $v = Get-Env $k
    if ($v) { $googleVars[$k] = $true; Write-Host "  [OK] $k" -ForegroundColor Green }
    else { $errors += "Missing $k"; Write-Host "  [MISS] $k" -ForegroundColor Red }
}
foreach ($k in $metaVars.Keys) {
    $v = Get-Env $k
    if ($v) { $metaVars[$k] = $true; Write-Host "  [OK] $k" -ForegroundColor Green }
    else { $errors += "Missing $k"; Write-Host "  [MISS] $k" -ForegroundColor Red }
}

# ═══════════════════════════════════════════
# 2. GOOGLE ADS OAUTH
# ═══════════════════════════════════════════
Write-Host "`n--- 2. GOOGLE ADS CONNECTION ---" -ForegroundColor Yellow

$devTok = Get-Env "GOOGLE_ADS_DEVELOPER_TOKEN"
$clientId = Get-Env "GOOGLE_ADS_CLIENT_ID"
$clientSecret = Get-Env "GOOGLE_ADS_CLIENT_SECRET"
$refreshTok = Get-Env "GOOGLE_ADS_REFRESH_TOKEN"
$custId = Get-Env "GOOGLE_ADS_CUSTOMER_ID"

try {
    $oauthBody = "client_id=$clientId&client_secret=$clientSecret&refresh_token=$refreshTok&grant_type=refresh_token"
    $oauthRes = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method Post -Body $oauthBody -ContentType "application/x-www-form-urlencoded"
    $accessTok = $oauthRes.access_token
    Write-Host "  [OK] OAuth token obtained" -ForegroundColor Green
} catch {
    $errors += "Google OAuth failed: $_"
    Write-Host "  [FAIL] OAuth: $_" -ForegroundColor Red
}

$headers = @{ Authorization = "Bearer $accessTok"; "developer-token" = $devTok; "Content-Type" = "application/json" }
$apiBase = "https://googleads.googleapis.com/v24/customers/$custId/googleAds:search"

function Invoke-GAQL($label, $gaql) {
    try {
        $body = ConvertTo-Json @{ query = $gaql }
        $res = Invoke-RestMethod -Uri $apiBase -Method Post -Headers $headers -Body $body -TimeoutSec 15
        $count = if ($res.results) { $res.results.Count } else { 0 }
        Write-Host "  [OK] $label — $count rows" -ForegroundColor Green
        return $res.results
    } catch {
        $msg = $_.Exception.Message
        if ($msg.Length -gt 150) { $msg = $msg.Substring(0, 150) + "..." }
        $errors += "$label failed: $msg"
        Write-Host "  [FAIL] $label — $msg" -ForegroundColor Red
        return @()
    }
}

# ═══════════════════════════════════════════
# 3. GOOGLE ADS QUERIES (EXACT CODE QUERIES)
# ═══════════════════════════════════════════
Write-Host "`n--- 3. GOOGLE ADS API QUERIES ---" -ForegroundColor Yellow

$campRes = Invoke-GAQL "fetchCampaigns" @"
SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign_budget.amount_micros, campaign_budget.type FROM campaign WHERE campaign.status != 'REMOVED' ORDER BY campaign.name
"@

$agRes = Invoke-GAQL "fetchAdGroups" @"
SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.type, ad_group.campaign, ad_group.cpc_bid_micros, ad_group.target_cpa_micros, ad_group.target_roas FROM ad_group WHERE ad_group.status != 'REMOVED'
"@

$adRes = Invoke-GAQL "fetchAds" @"
SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.status, ad_group_ad.ad.type, ad_group_ad.ad_group, ad_group_ad.ad.final_urls, ad_group_ad.ad.display_url FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED'
"@

$perfRes = Invoke-GAQL "fetchPerformanceMetrics (30d)" @"
SELECT campaign.id, ad_group.id, ad_group_ad.ad.id, segments.date, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.average_cpm, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.cost_per_conversion FROM ad_group_ad WHERE segments.date BETWEEN '2026-05-30' AND '2026-06-29' AND campaign.status != 'REMOVED'
"@

# Compute totals from performance data
if ($perfRes.Count -gt 0) {
    $totalSpend = 0; $totalImp = 0; $totalClicks = 0; $totalConv = 0; $totalConvVal = 0; $days = @{}
    foreach ($r in $perfRes) {
        $totalSpend += [double]$r.metrics.costMicros / 1000000
        $totalImp += [long]$r.metrics.impressions
        $totalClicks += [long]$r.metrics.clicks
        $totalConv += [double]$r.metrics.conversions
        $totalConvVal += [double]$r.metrics.conversionsValue
        $d = $r.segments.date; if ($d) { $days[$d] = $true }
    }
    Write-Host "`n  Google Ads 30-day TOTALS:" -ForegroundColor White
    Write-Host "    Spend:     €$([math]::Round($totalSpend, 2))" -ForegroundColor White
    Write-Host "    Impr:      $totalImp" -ForegroundColor White
    Write-Host "    Clicks:    $totalClicks" -ForegroundColor White
    Write-Host "    Conv:      $totalConv" -ForegroundColor White
    Write-Host "    ConvValue: €$([math]::Round($totalConvVal, 2))" -ForegroundColor White
    Write-Host "    Days:      $($days.Count)" -ForegroundColor White
}

# ═══════════════════════════════════════════
# 4. META ADS QUERIES (EXACT CODE FIELDS)
# ═══════════════════════════════════════════
Write-Host "`n--- 4. META ADS CONNECTION ---" -ForegroundColor Yellow

$metaToken = Get-Env "META_ACCESS_TOKEN"
$metaActId = Get-Env "META_AD_ACCOUNT_ID"
$metaBase = "https://graph.facebook.com/v25.0"

function Invoke-Meta($label, $path, $params) {
    try {
        $url = "$metaBase$path"
        $sep = if ($url.Contains("?")) { "&" } else { "?" }
        $url += "${sep}access_token=$metaToken"
        foreach ($k in $params.Keys) { $url += "&$k=$($params[$k])" }
        $res = Invoke-RestMethod -Uri $url -TimeoutSec 15
        if ($res.error) {
            $errors += "Meta $label : $($res.error.message)"
            Write-Host "  [FAIL] $label — $($res.error.message)" -ForegroundColor Red
            return $null
        }
        $count = if ($res.data) { $res.data.Count } else { 0 }
        Write-Host "  [OK] $label — $count rows" -ForegroundColor Green
        return $res
    } catch {
        $errors += "Meta $label : $_"
        Write-Host "  [FAIL] $label — $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "`n--- 5. META ADS API QUERIES ---" -ForegroundColor Yellow

$mcRes = Invoke-Meta "fetchCampaigns" "/$metaActId/campaigns" @{
    fields = "id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,special_ad_categories,created_time"
    limit = "200"
}

$msRes = Invoke-Meta "fetchAdSets" "/$metaActId/adsets" @{
    fields = "id,name,campaign_id,status,daily_budget,lifetime_budget,budget_remaining,targeting,created_time,start_time,end_time,bid_strategy,optimization_goal"
    limit = "200"
}

$maRes = Invoke-Meta "fetchAds" "/$metaActId/ads" @{
    fields = "id,name,adset_id,campaign_id,status,creative{id,title,body,image_url,thumbnail_url,video_id,object_story_spec,call_to_action_type,link_url},created_time"
    limit = "200"
}

$insRes = Invoke-Meta "fetchInsights (30d)" "/$metaActId/insights" @{
    fields = "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,impressions,reach,frequency,clicks,unique_clicks,ctr,cpc,cpm,spend,actions,action_values,cost_per_action_type,video_avg_time_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions"
    level = "ad"
    time_range = '{"since":"2026-05-30","until":"2026-06-29"}'
    time_increment = "1"
    limit = "500"
}

if ($insRes -and $insRes.data) {
    $mSpend = 0; $mImp = 0; $mClicks = 0; $mDays = @{}
    foreach ($r in $insRes.data) {
        $mSpend += [double]$r.spend
        $mImp += [long]$r.impressions
        $mClicks += [long]$r.clicks
        if ($r.date_start) { $mDays[$r.date_start] = $true }
    }
    Write-Host "`n  Meta Ads 30-day TOTALS:" -ForegroundColor White
    Write-Host "    Spend:     €$([math]::Round($mSpend, 2))" -ForegroundColor White
    Write-Host "    Impr:      $mImp" -ForegroundColor White
    Write-Host "    Clicks:    $mClicks" -ForegroundColor White
    Write-Host "    Days:      $($mDays.Count)" -ForegroundColor White
}

# ═══════════════════════════════════════════
# 6. SUMMARY
# ═══════════════════════════════════════════
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AUDIT SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($errors.Count -eq 0) {
    Write-Host "All checks passed! System is ready." -ForegroundColor Green
    Write-Host "`n  Google 30d total spend: €$([math]::Round($totalSpend, 2))"
    Write-Host "  Meta 30d total spend:    €$([math]::Round($mSpend, 2))"
    Write-Host "  Combined:                €$([math]::Round($totalSpend + $mSpend, 2))"
} else {
    Write-Host "$($errors.Count) errors found:" -ForegroundColor Red
    foreach ($e in $errors) { Write-Host "  - $e" -ForegroundColor Red }
}
