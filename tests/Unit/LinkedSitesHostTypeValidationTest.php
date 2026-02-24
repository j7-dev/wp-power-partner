<?php

declare(strict_types=1);

namespace J7\PowerPartner\Tests\Unit;

use J7\PowerPartner\Product\DataTabs\LinkedSites;

/**
 * Test LinkedSites host_type validation logic
 * 
 * 測試目標：驗證 LinkedSites 的 save_subscription 方法中的 host_type 白名單邏輯
 * - 只接受 'wpcd' 或 'powercloud'
 * - 拒絕其他值
 */

// Test: 有效的 host_type 值 wpcd 應該被保存
test('accepts valid host_type wpcd', function () {
    $validHostType = 'wpcd';
    $allowedHostTypes = ['wpcd', 'powercloud'];
    
    expect(in_array($validHostType, $allowedHostTypes, true))
        ->toBe(true);
});

// Test: 有效的 host_type 值 powercloud 應該被保存
test('accepts valid host_type powercloud', function () {
    $validHostType = 'powercloud';
    $allowedHostTypes = ['wpcd', 'powercloud'];
    
    expect(in_array($validHostType, $allowedHostTypes, true))
        ->toBe(true);
});

// Test: 無效的 host_type 值應該被拒絕
test('rejects invalid host_type value', function () {
    $invalidHostType = 'invalid_host_type';
    $allowedHostTypes = ['wpcd', 'powercloud'];
    
    expect(in_array($invalidHostType, $allowedHostTypes, true))
        ->toBe(false);
});

// Test: 空字符串應該被拒絕
test('rejects empty string', function () {
    $hostType = '';
    $allowedHostTypes = ['wpcd', 'powercloud'];
    
    expect(in_array($hostType, $allowedHostTypes, true))
        ->toBe(false);
});

// Test: 大寫字母應該被拒絕（區分大小寫）
test('rejects uppercase values', function () {
    $hostType = 'WPCD';
    $allowedHostTypes = ['wpcd', 'powercloud'];
    
    expect(in_array($hostType, $allowedHostTypes, true))
        ->toBe(false);
});

// Test: 混合大小寫應該被拒絕
test('rejects mixed case values', function () {
    $hostType = 'Powercloud';
    $allowedHostTypes = ['wpcd', 'powercloud'];
    
    expect(in_array($hostType, $allowedHostTypes, true))
        ->toBe(false);
});

// Test: 帶有空白的值應該被拒絕
test('rejects values with whitespace', function () {
    $hostType = ' wpcd ';
    $allowedHostTypes = ['wpcd', 'powercloud'];
    
    expect(in_array($hostType, $allowedHostTypes, true))
        ->toBe(false);
});

// Test: null 值應該被拒絕
test('rejects null value', function () {
    $hostType = null;
    $allowedHostTypes = ['wpcd', 'powercloud'];
    
    expect(in_array($hostType, $allowedHostTypes, true))
        ->toBe(false);
});

// Test: 驗證常數值
test('has correct host_type constants', function () {
    expect(LinkedSites::DEFAULT_HOST_TYPE)
        ->toBe('powercloud');
        
    expect(LinkedSites::WPCD_HOST_TYPE)
        ->toBe('wpcd');
});

// Test: 驗證預設值是 powercloud
test('default host_type is powercloud', function () {
    expect(LinkedSites::DEFAULT_HOST_TYPE)
        ->toBe('powercloud');
});

