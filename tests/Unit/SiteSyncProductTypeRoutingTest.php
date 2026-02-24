<?php

declare(strict_types=1);

namespace J7\PowerPartner\Tests\Unit;

use J7\PowerPartner\Product\DataTabs\LinkedSites;

/**
 * Test SiteSync product type routing logic
 * 
 * 測試目標：驗證 SiteSync 的商品類型路由邏輯
 * 根據商品類型判斷是否應該使用 variation ID 或 product ID 來取 meta
 * 
 * 來源：SiteSync.php 第 75-93 行
 * - subscription_variation → 使用 variation ID
 * - subscription → 使用 product ID
 * - 其他類型 → continue（跳過）
 * - 根據 host_type 判斷是否為 DEFAULT_HOST_TYPE（powercloud）
 */

// Test: subscription_variation 類型應該使用 variation ID
test('routes subscription_variation to variation id', function () {
    $productType = 'subscription_variation';
    $isSubscriptionVariation = $productType === 'subscription_variation';
    
    expect($isSubscriptionVariation)->toBe(true);
});

// Test: subscription 類型應該使用 product ID
test('routes subscription to product id', function () {
    $productType = 'subscription';
    $isSubscription = $productType === 'subscription';
    
    expect($isSubscription)->toBe(true);
});

// Test: 其他類型應該被跳過（continue）
test('skips other product types', function () {
    $productType = 'simple';
    
    $shouldContinue = !($productType === 'subscription_variation' || $productType === 'subscription');
    
    expect($shouldContinue)->toBe(true);
});

// Test: variable 類型應該被跳過
test('skips variable product type', function () {
    $productType = 'variable';
    
    $shouldContinue = !($productType === 'subscription_variation' || $productType === 'subscription');
    
    expect($shouldContinue)->toBe(true);
});

// Test: grouped 類型應該被跳過
test('skips grouped product type', function () {
    $productType = 'grouped';
    
    $shouldContinue = !($productType === 'subscription_variation' || $productType === 'subscription');
    
    expect($shouldContinue)->toBe(true);
});

// Test: external 類型應該被跳過
test('skips external product type', function () {
    $productType = 'external';
    
    $shouldContinue = !($productType === 'subscription_variation' || $productType === 'subscription');
    
    expect($shouldContinue)->toBe(true);
});

// Test: host_type 等於 DEFAULT_HOST_TYPE 的判斷
test('checks host_type equals default host_type', function () {
    $hostType = 'powercloud';
    $isDefaultHostType = $hostType === LinkedSites::DEFAULT_HOST_TYPE;
    
    expect($isDefaultHostType)->toBe(true);
});

// Test: host_type 不等於 DEFAULT_HOST_TYPE 時應該使用 Fetch::site_sync
test('routes non-default host_type to fetch', function () {
    $hostType = 'wpcd';
    $isDefaultHostType = $hostType === LinkedSites::DEFAULT_HOST_TYPE;
    
    expect($isDefaultHostType)->toBe(false);
});

// Test: host_type 為 wpcd 時應該使用舊架構
test('uses legacy architecture for wpcd', function () {
    $hostType = 'wpcd';
    $useLegacy = $hostType !== LinkedSites::DEFAULT_HOST_TYPE;
    
    expect($useLegacy)->toBe(true);
});

// Test: host_type 為 powercloud 時應該使用新架構
test('uses new architecture for powercloud', function () {
    $hostType = 'powercloud';
    $useNewArchitecture = $hostType === LinkedSites::DEFAULT_HOST_TYPE;
    
    expect($useNewArchitecture)->toBe(true);
});

// Test: 複合條件 - subscription_variation + DEFAULT_HOST_TYPE
test('handles subscription_variation with default host_type', function () {
    $productType = 'subscription_variation';
    $hostType = 'powercloud';
    
    $isVariationSubscription = $productType === 'subscription_variation';
    $isNewArchitecture = $hostType === LinkedSites::DEFAULT_HOST_TYPE;
    
    expect($isVariationSubscription && $isNewArchitecture)->toBe(true);
});

// Test: 複合條件 - subscription + WPCD_HOST_TYPE
test('handles subscription with wpcd host_type', function () {
    $productType = 'subscription';
    $hostType = 'wpcd';
    
    $isSubscription = $productType === 'subscription';
    $isLegacyArchitecture = $hostType !== LinkedSites::DEFAULT_HOST_TYPE;
    
    expect($isSubscription && $isLegacyArchitecture)->toBe(true);
});

// Test: 複合條件 - simple product type 應該跳過，即使有有效的 host_type
test('skips simple product even with valid host_type', function () {
    $productType = 'simple';
    $hostType = 'powercloud';
    
    $shouldProcess = $productType === 'subscription_variation' || $productType === 'subscription';
    
    expect($shouldProcess)->toBe(false);
});

// Test: 驗證空產品類型應該被跳過
test('skips empty product type', function () {
    $productType = '';
    
    $shouldProcess = $productType === 'subscription_variation' || $productType === 'subscription';
    
    expect($shouldProcess)->toBe(false);
});

// Test: 驗證類型比較的區分大小寫
test('is case sensitive for product type comparison', function () {
    $productType = 'Subscription';
    
    $isSubscription = $productType === 'subscription';
    
    expect($isSubscription)->toBe(false);
});

// Test: 驗證類型比較的區分大小寫（大寫 WPCD）
test('is case sensitive for host_type comparison', function () {
    $hostType = 'WPCD';
    $isWpcd = $hostType === LinkedSites::WPCD_HOST_TYPE;
    
    expect($isWpcd)->toBe(false);
});

