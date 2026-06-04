/* eslint-disable @typescript-eslint/no-explicit-any */
import { createChangeLog, getCampaign, updateChangeRequest } from './admin-queries'
import * as google from './google-ads'
import * as meta from './meta-ads'
import type { ChangeRequest, MutationPayload } from './types'

export async function executeMutation(
  changeRequest: ChangeRequest,
): Promise<{ success: boolean; error?: string; apiResponse?: any }> {
  const { platform, target_type, target_platform_id, after_values, action_type, id: changeRequestId } = changeRequest
  if (!target_platform_id) return { success: false, error: 'Missing target_platform_id' }

  let result: { success: boolean; data?: any; error?: string }

  try {
    if (platform === 'google_ads') {
      const { data: campaign } = await getCampaign(changeRequest.target_id || '')
      const customerId = campaign?.account_id
        ? (await (await import('./supabase')).getAdAccount(campaign.account_id))?.data?.platform_account_id
        : null

      if (!customerId) return { success: false, error: 'Could not resolve Google Ads customer ID' }

      if (target_type === 'campaign') {
        result = await google.mutateCampaign(customerId, target_platform_id, action_type, after_values || undefined)
      } else if (target_type === 'ad_group') {
        result = await google.mutateAdGroup(customerId, target_platform_id, action_type)
      } else if (target_type === 'ad') {
        result = await google.mutateAd(customerId, target_platform_id, action_type)
      } else {
        return { success: false, error: `Unsupported target type: ${target_type}` }
      }
    } else if (platform === 'meta_ads') {
      if (target_type === 'campaign') {
        result = await meta.mutateCampaign(target_platform_id, action_type, after_values || undefined)
      } else if (target_type === 'ad_set') {
        result = await meta.mutateAdSet(target_platform_id, action_type, after_values || undefined)
      } else if (target_type === 'ad') {
        result = await meta.mutateAd(target_platform_id, action_type)
      } else {
        return { success: false, error: `Unsupported target type: ${target_type}` }
      }
    } else {
      return { success: false, error: `Unsupported platform: ${platform}` }
    }

    // Log to change_logs
    await createChangeLog({
      company_id: changeRequest.company_id,
      change_request_id: changeRequestId,
      platform,
      action_type,
      target_type,
      target_name: changeRequest.title,
      target_platform_id,
      before_values: changeRequest.before_values,
      after_values: changeRequest.after_values,
      result: result.success ? 'success' : 'failed',
      api_response: result.data || null,
      error_message: result.error || null,
      performed_by: changeRequest.reviewed_by,
      performed_at: new Date().toISOString(),
    })

    // Update change request status
    const newStatus = result.success ? 'executed' : 'failed'
    await updateChangeRequest(changeRequestId, {
      status: newStatus as any,
      executed_at: result.success ? new Date().toISOString() : undefined,
      api_response: result.data || null,
      error_message: result.error || null,
    })

    return {
      success: result.success,
      error: result.error,
      apiResponse: result.data,
    }
  } catch (err: any) {
    // Log failure
    await createChangeLog({
      company_id: changeRequest.company_id,
      change_request_id: changeRequestId,
      platform,
      action_type,
      target_type,
      target_name: changeRequest.title,
      target_platform_id,
      before_values: changeRequest.before_values,
      after_values: changeRequest.after_values,
      result: 'failed',
      error_message: err.message,
      performed_at: new Date().toISOString(),
    })

    await updateChangeRequest(changeRequestId, {
      status: 'failed',
      error_message: err.message,
    })

    return { success: false, error: err.message }
  }
}

export async function buildChangeRequestFromAction(
  payload: MutationPayload,
  companyId: string,
  userId: string,
): Promise<Partial<import('./types').ChangeRequest>> {
  const { action, target_type, target_id, platform, values } = payload

  // Get current state for before_values
  const db = await import('./supabase')
  let beforeValues: Record<string, unknown> = {}
  let targetPlatformId: string | null = null

  if (target_type === 'campaign') {
    const { data: campaign } = await db.getCampaign(target_id)
    if (campaign) {
      beforeValues = {
        status: campaign.status,
        daily_budget: campaign.daily_budget,
        lifetime_budget: campaign.lifetime_budget,
      }
      targetPlatformId = campaign.platform_campaign_id
    }
  } else if (target_type === 'ad_group') {
    const { data: adGroup } = await import('./supabase').then(m => m.getAdGroups())
    if (adGroup) {
      const g = adGroup.find((a: any) => a.id === target_id)
      if (g) {
        beforeValues = { status: g.status }
        targetPlatformId = g.platform_ad_group_id
      }
    }
  } else if (target_type === 'ad_set') {
    const { data: adSets } = await db.getAdSets()
    if (adSets) {
      const s = adSets.find((a: any) => a.id === target_id)
      if (s) {
        beforeValues = { status: s.status, daily_budget: s.daily_budget }
        targetPlatformId = s.platform_ad_set_id
      }
    }
  } else if (target_type === 'ad') {
    const { data: ads } = await db.getAds()
    if (ads) {
      const a = ads.find((ad: any) => ad.id === target_id)
      if (a) {
        beforeValues = { status: a.status }
        targetPlatformId = a.platform_ad_id
      }
    }
  }

  // Build action descriptions
  const actionLabels: Record<string, string> = {
    pause_campaign: 'Pause Campaign',
    resume_campaign: 'Resume Campaign',
    update_budget: 'Update Budget',
    pause_ad_group: 'Pause Ad Group',
    resume_ad_group: 'Resume Ad Group',
    pause_ad_set: 'Pause Ad Set',
    resume_ad_set: 'Resume Ad Set',
    update_ad_set_budget: 'Update Ad Set Budget',
    pause_ad: 'Pause Ad',
    resume_ad: 'Resume Ad',
    create_ad_variant: 'Create Ad Variant',
    duplicate_campaign: 'Duplicate Campaign',
    duplicate_ad: 'Duplicate Ad',
    duplicate_ad_set: 'Duplicate Ad Set',
  }

  return {
    company_id: companyId,
    title: `${actionLabels[action] || action} - ${target_type} ${target_id}`,
    description: `Request to ${actionLabels[action]} ${target_type}`,
    platform,
    action_type: action,
    target_type,
    target_id,
    target_platform_id: targetPlatformId,
    before_values: beforeValues,
    after_values: values,
    status: 'pending',
    created_by: userId,
    source: 'manual',
    created_at: new Date().toISOString(),
  }
}
